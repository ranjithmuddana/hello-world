import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpRequestDecorator;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class WebClientWithFilter {

    public static void main(String[] args) {
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

    private static ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            // Create a new ClientHttpRequest to capture and log the body
            ClientHttpRequestDecorator decoratedRequest = new ClientHttpRequestDecorator(clientRequest) {
                @Override
                public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                    // Capture body for logging
                    return Mono.from(body)
                        .doOnNext(dataBuffer -> {
                            byte[] bytes = new byte[dataBuffer.readableByteCount()];
                            dataBuffer.read(bytes);
                            DataBufferUtils.release(dataBuffer);  // Release the buffer
                            String bodyString = new String(bytes, StandardCharsets.UTF_8);
                            System.out.println("Captured Request Body: " + bodyString);
                        })
                        .then(super.writeWith(body));
                }
            };

            // Return a new ClientRequest with the decorated request
            return Mono.just(ClientRequest.from(clientRequest)
                .body(BodyInserters.fromDataBuffers(decoratedRequest.getBody()))
                .build());
        });
    }
}