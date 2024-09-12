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
                // Clone the request to buffer the body and log it
                return Mono.defer(() -> {
                    // Here, we assume the request body is a Flux<DataBuffer>
                    // This should be customized based on your specific request type (e.g., Flux or Mono)
                    Flux<DataBuffer> bodyFlux = request.body().orElse(Flux.empty());
                    
                    // Join the body parts into a single buffer to log
                    return DataBufferUtils.join(bodyFlux)
                            .flatMap(dataBuffer -> {
                                byte[] bodyBytes = new byte[dataBuffer.readableByteCount()];
                                dataBuffer.read(bodyBytes);
                                DataBufferUtils.release(dataBuffer); // Release the buffer
                                String body = new String(bodyBytes, StandardCharsets.UTF_8);
                                log.info("Request body: {}", body);

                                // Now re-create the request with the same body
                                return Mono.just(ClientRequest.from(request)
                                        .body(BodyInserters.fromPublisher(Mono.just(body), String.class))
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