import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class WebClientWithFilter {

    public static void main(String[] args) {
        // Create WebClient with custom filter
        WebClient webClient = WebClient.builder()
            .filter(logRequest())  // Apply the custom filter for request logging
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
            // Buffer the body content (to capture it) and create a new ClientRequest
            return Mono.defer(() -> {
                BodyInserters.BodyInserter<?, ? super ClientHttpRequest> bodyInserter = clientRequest.body();
                
                // Prepare a new ClientRequest with the same properties as the original
                ClientRequest.Builder requestBuilder = ClientRequest.from(clientRequest);

                return Mono.create(sink -> {
                    // Create a new ClientHttpRequest to capture the body
                    bodyInserter.insert(new ClientHttpRequestWrapper(sink), BodyInserters.Context.of());

                    // Process the request further after body is captured
                    requestBuilder.body(BodyInserters.fromDataBuffers(sink.asFlux()))
                            .build();
                });
            });
        });
    }