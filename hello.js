import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Component
public class LoggingWebFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Capture start time
        Instant startTime = Instant.now();

        // Add incoming request details to MDC
        MDC.put("requestEndpoint", exchange.getRequest().getURI().getPath());
        MDC.put("eventType", "Incoming Request");
        MDC.put("httpMethod", exchange.getRequest().getMethodValue());
        MDC.put("userAgent", exchange.getRequest().getHeaders().getFirst("User-Agent"));
        MDC.put("contentType", exchange.getRequest().getHeaders().getContentType() != null
                ? exchange.getRequest().getHeaders().getContentType().toString() 
                : "Unknown");

        // Capture a field from the request body (example: "name" field in JSON)
        // You can modify this section depending on your request structure
        return exchange.getRequest().getBody()
            .next()
            .flatMap(dataBuffer -> {
                // Convert buffer to string to extract a field from JSON
                String requestBody = dataBuffer.toString();
                // Extract a field (e.g., "name") from the JSON (pseudo-code)
                String fieldValue = extractFieldFromJson(requestBody, "name");
                MDC.put("requestField", fieldValue != null ? fieldValue : "N/A");
                return chain.filter(exchange)
                    .doOnSuccess(unused -> logRequestResponseDetails(exchange, startTime))
                    .doFinally(signalType -> MDC.clear());
            });
    }

    private void logRequestResponseDetails(ServerWebExchange exchange, Instant startTime) {
        // Log outgoing request details
        MDC.put("eventType", "Outgoing Request");
        MDC.put("statusCode", String.valueOf(exchange.getResponse().getStatusCode().value()));
        MDC.put("statusMessage", exchange.getResponse().getStatusCode().getReasonPhrase());

        // Capture end time and duration
        Instant endTime = Instant.now();
        long duration = Duration.between(startTime, endTime).toMillis();
        MDC.put("startTime", startTime.toString());
        MDC.put("endTime", endTime.toString());
        MDC.put("duration", duration + "ms");

        // Log the details using the logger (you can adjust this to your needs)
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LoggingWebFilter.class);
        logger.info("Request-Response completed: {}", MDC.getCopyOfContextMap());
    }

    // Placeholder method to extract field from JSON request
    private String extractFieldFromJson(String json, String fieldName) {
        // Logic to parse JSON and extract the field (e.g., using Jackson or any other parser)
        // For simplicity, returning null here. Replace with actual JSON parsing logic.
        return null;
    }
}