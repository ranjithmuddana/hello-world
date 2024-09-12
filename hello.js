import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class WebClientWithFilter {

    public static void main(String[] args) {
        // Create WebClient with custom filter
        WebClient webClient = WebClient.builder()
            .filter(logRequest())
            .build();

        // Example usage of WebClient
        webClient.post()
            .uri("http://example.com/endpoint")
            .bodyValue("This is a test body")
            .retrieve()
            .bodyToMono(String.class)
            .subscribe(response -> {
                System.out.println("Response: " + response);
            });
    }

    // Custom filter function to log the request body
    private static ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            // Clone the body of the request
            return clientRequest.body()
                .map(bodyInserter -> {
                    // Prepare a new ClientRequest
                    ClientRequest newRequest = ClientRequest.from(clientRequest)
                        .body((outputMessage, context) -> {
                            // Capture the body as a DataBuffer Flux
                            Flux<DataBuffer> bodyFlux = captureBody(bodyInserter, outputMessage);
                            // Convert DataBuffer to String for logging
                            return bodyFlux.map(dataBuffer -> {
                                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                                dataBuffer.read(bytes);
                                DataBufferUtils.release(dataBuffer);
                                String bodyString = new String(bytes, StandardCharsets.UTF_8);
                                System.out.println("Captured Request Body: " + bodyString);  // Log body
                                return dataBuffer;
                            });
                        })
                        .build();
                    return Mono.just(newRequest);
                });
        });
    }

    // Capture body from the bodyInserter
    private static Flux<DataBuffer> captureBody(ClientRequest.BodyInserter<?, ? super ClientHttpRequest> bodyInserter, ClientHttpRequest outputMessage) {
        // Buffering body to read it later
        return Flux.defer(() -> {
            // Use a buffer to store the body
            return bodyInserter.insert(outputMessage, new BodyInserter.Context() {
                @Override
                public Mono<Void> writeWith(Flux<DataBuffer> body) {
                    return Mono.from(body);
                }
            }).thenMany(outputMessage.getBody());
        });
    }
}