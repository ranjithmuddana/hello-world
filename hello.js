import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;
import reactor.core.scheduler.Schedulers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingContextWebFilter implements WebFilter {

    private static final Logger logger = LoggerFactory.getLogger(LoggingContextWebFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Start logging request details
        logger.info("Incoming request: {}", exchange.getRequest().getURI());

        return Mono.deferContextual(ctx -> {
            // Set request-specific context, like request ID
            String requestId = exchange.getRequest().getId();
            return Mono.just(requestId)
                    .contextWrite(Context.of("requestId", requestId))
                    // Continue with the filter chain
                    .flatMap(reqId -> chain.filter(exchange))
                    .doFinally(signalType -> {
                        // Log and clear the context after the response is processed
                        logger.info("Response for request: {} completed", requestId);
                        Context.clear();  // Ensure context is cleared after processing
                    });
        }).subscribeOn(Schedulers.boundedElastic());  // Use Reactor thread pool for request handling
    }
}