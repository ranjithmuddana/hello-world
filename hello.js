import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
public class WebFluxConfig {

    private static final Logger logger = LoggerFactory.getLogger(WebFluxConfig.class);
    public static final String TRACKING_CONTEXT_KEY = "trackingFields";

    @Bean
    @Order(-1) // Ensure this runs before other filters
    public WebFilter mdcFilter() {
        return (exchange, chain) -> {
            Map<String, String> contextMap = exchange.getRequest().getHeaders().toSingleValueMap().entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("X-Tracking-"))
                .collect(Collectors.toMap(
                    entry -> entry.getKey().substring("X-Tracking-".length()),
                    Map.Entry::getValue
                ));

            return chain.filter(exchange)
                .contextWrite(Context.of(TRACKING_CONTEXT_KEY, contextMap))
                .doOnEach(signal -> {
                    if (!signal.isOnComplete()) {
                        Map<String, String> context = signal.getContextView().get(TRACKING_CONTEXT_KEY);
                        MDC.setContextMap(context);
                    }
                })
                .doFinally(signalType -> MDC.clear());
        };
    }

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .filter((request, next) -> {
                return next.exchange(request)
                    .contextWrite(context -> {
                        Map<String, String> trackingFields = context.getOrDefault(TRACKING_CONTEXT_KEY, new HashMap<>());
                        trackingFields.forEach((key, value) -> request.headers().add("X-Tracking-" + key, value));
                        return context;
                    });
            })
            .build();
    }
}

@RestController
class ExampleController {
    private static final Logger logger = LoggerFactory.getLogger(ExampleController.class);
    private final MyService myService;

    public ExampleController(MyService myService) {
        this.myService = myService;
    }

    @GetMapping("/example")
    public Mono<String> handleRequest(ServerWebExchange exchange) {
        return Mono.deferContextual(context -> {
            Map<String, String> trackingFields = context.get(WebFluxConfig.TRACKING_CONTEXT_KEY);
            logger.info("Received request with tracking fields: {}", trackingFields);
            
            return myService.doSomething()
                .map(result -> {
                    logger.info("Sending response with tracking fields: {}", trackingFields);
                    return result;
                });
        });
    }
}

class MyService {
    private static final Logger logger = LoggerFactory.getLogger(MyService.class);
    private final WebClient webClient;

    public MyService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<String> doSomething() {
        return Mono.deferContextual(context -> {
            Map<String, String> trackingFields = context.get(WebFluxConfig.TRACKING_CONTEXT_KEY);
            logger.info("Processing in service with tracking fields: {}", trackingFields);
            return webClient.get()
                .uri("http://example.com/api")
                .retrieve()
                .bodyToMono(String.class);
        });
    }
}