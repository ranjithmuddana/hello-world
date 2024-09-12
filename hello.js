import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.ServerHttpResponse;
import org.springframework.web.server.ServerHttpRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
        ServerHttpResponse originalResponse = exchange.getResponse();
        HttpHeaders headers = originalResponse.getHeaders();
        headers.add("X-Request-ID", uuid);
        headers.add("X-App-ID", APP_ID);

        // Capture request details
        String requestMethod = exchange.getRequest().getMethodValue();
        String requestUri = exchange.getRequest().getURI().toString();
        String userAgent = exchange.getRequest().getHeaders().getFirst("User-Agent");
        String contentType = exchange.getRequest().getHeaders().getFirst("Content-Type");

        // Capture and re-wrap request body
        return DataBufferUtils.join(exchange.getRequest().getBody())
            .flatMap(dataBuffer -> {
                byte[] requestBodyBytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(requestBodyBytes);
                DataBufferUtils.release(dataBuffer); // Release buffer memory

                String requestBody = new String(requestBodyBytes, StandardCharsets.UTF_8);
                String specificField = "N/A";

                // Parse JSON field from request body
                try {
                    JsonNode rootNode = objectMapper.readTree(requestBody);
                    JsonNode fieldNode = rootNode.path("specificField"); // Adjust path as needed
                    if (!fieldNode.isMissingNode()) {
                        specificField = fieldNode.asText();
                    }
                } catch (IOException e) {
                    specificField = "Error parsing JSON";
                }

                // Rewrap the request body into a new ServerHttpRequest
                ServerHttpRequest mutatedRequest = exchange.getRequest().mutate().build();

                // Provide the body as a Flux<DataBuffer> to the next filter in the chain
                Flux<DataBuffer> cachedFlux = Flux.defer(() -> {
                    DataBuffer buffer = new DefaultDataBufferFactory().wrap(requestBodyBytes);
                    return Flux.just(buffer);
                });

                // Decorate the response
                ServerHttpResponseDecorator decoratedResponse = decorateResponse(exchange, originalResponse, startTime);

                // Update MDC with request details
                MDC.put("RequestURI", requestUri);
                MDC.put("HttpMethod", requestMethod);
                MDC.put("UserAgent", userAgent);
                MDC.put("ContentType", contentType);
                MDC.put("StartTime", startTime.toString());
                MDC.put("EventType", "Incoming Request");
                MDC.put("Request", requestBody); // Add request body to MDC
                MDC.put("SpecificField", specificField);
                MDC.put("AppId", APP_ID); // Add appId to MDC
                MDC.put("RequestID", uuid); // Add UUID to MDC

                // Proceed with the chain using the wrapped request and decorated response
                return chain.filter(exchange.mutate().request(mutatedRequest).response(decoratedResponse).build())
                    .doOnSuccess(unused -> {
                        // Log after the response is processed
                        Instant endTime = Instant.now();
                        MDC.put("EndTime", endTime.toString());
                        MDC.put("Duration", Duration.between(startTime, endTime).toMillis() + " ms");
                        MDC.put("EventType", "Outgoing Request");
                    })
                    .doFinally(signalType -> {
                        // Clear MDC after processing is done
                        MDC.clear();
                    });
            });
    }

    private ServerHttpResponseDecorator decorateResponse(ServerWebExchange exchange, ServerHttpResponse originalResponse, Instant startTime) {
        return new ServerHttpResponseDecorator(originalResponse) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                // Capture response body
                return Flux.from(body)
                    .buffer()
                    .flatMap(dataBuffers -> {
                        // Merge DataBuffers to capture response body
                        DataBuffer joinedBuffer = new DefaultDataBufferFactory().join(dataBuffers);
                        byte[] responseBodyBytes = new byte[joinedBuffer.readableByteCount()];
                        joinedBuffer.read(responseBodyBytes);

                        String responseBody = new String(responseBodyBytes, StandardCharsets.UTF_8);

                        // Add response body and status to MDC
                        MDC.put("ResponseStatusCode", String.valueOf(getStatusCode().value()));
                        MDC.put("ResponseBody", responseBody);

                        // Release buffers
                        dataBuffers.forEach(DataBufferUtils::release);

                        // Return a single DataBuffer with the original content to send the response
                        return super.writeWith(Flux.just(joinedBuffer));
                    });
            }

            private HttpHeaders getResponseHeaders() {
                return this.getHeaders();
            }

            private HttpStatus getStatusCode() {
                return this.getStatusCode() != null ? this.getStatusCode() : HttpStatus.OK;
            }
        };
    }
}