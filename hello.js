import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.ServerHttpResponse;
import org.springframework.web.server.ServerHttpRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
public class LoggingWebFilter implements WebFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String APP_ID = "myAppId"; // Set your appId here

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        Instant startTime = Instant.now();
        
        // Generate UUID and set response header
        String uuid = UUID.randomUUID().toString();
        ServerHttpResponse response = exchange.getResponse();
        response.getHeaders().add("X-Request-ID", uuid);
        response.getHeaders().add("X-App-ID", APP_ID);

        // Capture request details
        String requestMethod = exchange.getRequest().getMethodValue();
        String requestUri = exchange.getRequest().getURI().toString();
        String userAgent = exchange.getRequest().getHeaders().getFirst("User-Agent");
        String contentType = exchange.getRequest().getHeaders().getFirst("Content-Type");

        // Buffer the request body
        return exchange.getRequest().getBody()
            .collectList()
            .flatMap(bufferList -> {
                byte[] requestBody = bufferList.stream()
                    .reduce((a, b) -> a.concat(b))
                    .orElse(new byte[0]);

                // Parse JSON field from request body
                String specificField = "N/A";
                try {
                    JsonNode rootNode = objectMapper.readTree(requestBody);
                    JsonNode fieldNode = rootNode.path("specificField"); // Adjust path as needed
                    if (!fieldNode.isMissingNode()) {
                        specificField = fieldNode.asText();
                    }
                } catch (IOException e) {
                    specificField = "Error parsing JSON";
                }

                // Convert byte array back to DataBuffer for request
                DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(requestBody);

                // Capture and wrap the response
                ServerHttpResponse decoratedResponse = new DecoratingServerHttpResponse(response, buffer);

                // Populate MDC with request details
                MDC.put("RequestURI", requestUri);
                MDC.put("HttpMethod", requestMethod);
                MDC.put("UserAgent", userAgent);
                MDC.put("ContentType", contentType);
                MDC.put("StartTime", startTime.toString());
                MDC.put("EventType", "Incoming Request");
                MDC.put("Request", new String(requestBody)); // Add request body to MDC
                MDC.put("SpecificField", specificField);
                MDC.put("AppId", APP_ID); // Add appId to MDC
                MDC.put("RequestID", uuid); // Add UUID to MDC

                // Continue with the request processing
                return chain.filter(exchange.mutate().request(exchange.getRequest().mutate().body(Flux.just(buffer)).build()).build())
                    .then(Mono.defer(() -> {
                        // Update MDC with response details
                        MDC.put("Response", new String(decoratedResponse.getBuffer().asByteBuffer().array())); // Add response body to MDC
                        MDC.put("ResponseStatus", decoratedResponse.getStatusCode() != null ? decoratedResponse.getStatusCode().toString() : "UNKNOWN");
                        MDC.put("ResponseID", decoratedResponse.getHeaders().getFirst("X-Request-ID")); // Add UUID from response header
                        MDC.put("EndTime", Instant.now().toString());
                        MDC.put("Duration", Duration.between(startTime, Instant.now()).toMillis() + " ms");
                        MDC.put("EventType", "Outgoing Request");
                        return Mono.empty();
                    }))
                    .doFinally(signalType -> {
                        // Clear MDC only after request processing is complete
                        MDC.clear();
                    });
            });
    }
}

class DecoratingServerHttpResponse extends ServerHttpResponseDecorator {

    private final DataBuffer dataBuffer;

    public DecoratingServerHttpResponse(ServerHttpResponse delegate, DataBuffer dataBuffer) {
        super(delegate);
        this.dataBuffer = dataBuffer;
    }

    @Override
    public Flux<DataBuffer> writeWith(Publisher<? extends DataBuffer> body) {
        return super.writeWith(Flux.concat(Flux.just(dataBuffer), Flux.from(body)));
    }

    @Override
    public Mono<Void> writeWith(Publisher<? extends DataBuffer> body, DataBufferFactory dataBufferFactory) {
        return super.writeWith(Flux.concat(Flux.just(dataBuffer), Flux.from(body)), dataBufferFactory);
    }

    public DataBuffer getBuffer() {
        return this.dataBuffer;
    }
}