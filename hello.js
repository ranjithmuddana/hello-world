import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class WebClientConfig {

    public WebClient webClient() {
        return WebClient.builder()
            .filter(addMdcToHeaders()) // Add MDC to headers for propagation
            .build();
    }

    private ExchangeFilterFunction addMdcToHeaders() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            // Extract MDC values and add them to the headers
            return ReactorContextMdc.withMdc(Mono.defer(() -> {
                Map<String, String> mdcContext = MDC.getCopyOfContextMap();
                if (mdcContext != null && mdcContext.containsKey("correlationId")) {
                    clientRequest.headers().add("X-Correlation-ID", mdcContext.get("correlationId"));
                }
                return Mono.just(clientRequest);
            }));
        });
    }
}