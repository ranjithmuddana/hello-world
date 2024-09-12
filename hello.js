import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class WebClientLoggingExample {

    private static final Logger log = LoggerFactory.getLogger(WebClientLoggingExample.class);

    public static void main(String[] args) {
        WebClient client = WebClient.builder()
                .baseUrl("https://example.com")
                .filter(logRequest())
                .filter(logResponse())
                .build();

        // Example request with body
        client.post()
              .uri("/path")
              .bodyValue("Sample request body")
              .retrieve()
              .bodyToMono(String.class)
              .subscribe(response -> log.info("Response body: {}", response));
    }

    private static ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info("Request: {} {}", clientRequest.method(), clientRequest.url());
            clientRequest.headers().forEach((name, values) -> 
                values.forEach(value -> log.info("{}: {}", name, value))
            );

            // If request has a body, buffer and log it
            return logRequestBody(clientRequest);
        });
    }

    private static Mono<ClientRequest> logRequestBody(ClientRequest request) {
        return Mono.defer(() -> {
            if (request.body() != null) {
                // Buffer and log the body (DataBuffer is used to capture the body in WebFlux)
                return request.body().insert(BodyInserters.fromPublisher(Flux.empty(), Void.class))
                        .flatMap(body -> {
                            DataBufferUtils.join(body)
                                    .flatMap(dataBuffer -> {
                                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                                        dataBuffer.read(bytes);
                                        DataBufferUtils.release(dataBuffer); // Always release the data buffer
                                        String bodyString = new String(bytes, StandardCharsets.UTF_8);
                                        log.info("Request body: {}", bodyString);

                                        // Now, we re-create the request with the same body
                                        return Mono.just(ClientRequest.from(request)
                                                .body(BodyInserters.fromValue(bodyString))
                                                .build());
                                    });
                        });
            } else {
                return Mono.just(request);
            }
        });
    }

    private static ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            log.info("Response status: {}", clientResponse.statusCode());
            clientResponse.headers().asHttpHeaders().forEach((name, values) ->
                values.forEach(value -> log.info("{}: {}", name, value))
            );
            return logResponseBody(clientResponse);
        });
    }

    private static Mono<ClientResponse> logResponseBody(ClientResponse response) {
        return response.bodyToMono(String.class)
                .flatMap(body -> {
                    log.info("Response body: {}", body);
                    // Return a new ClientResponse with the same body
                    return Mono.just(ClientResponse.from(response).body(BodyInserters.fromValue(body)).build());
                });
    }
}