import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public class WebClientLoggingExample {

    private static final Logger log = LoggerFactory.getLogger(WebClientLoggingExample.class);

    public static void main(String[] args) {
        WebClient client = WebClient.builder()
                .baseUrl("https://example.com")
                .filter(logRequest())
                .filter(logResponse())
                .build();

        client.get()
              .uri("/path")
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
            return Mono.just(clientRequest);
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
                    return Mono.just(ClientResponse.from(response).body(body).build());
                });
    }
}