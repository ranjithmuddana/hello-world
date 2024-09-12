import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class RequestResponseCachingFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerHttpResponse originalResponse = exchange.getResponse();

        // Cache the request body
        return DataBufferUtils.join(request.getBody())
                .flatMap(requestBuffer -> {
                    byte[] requestBodyBytes = new byte[requestBuffer.readableByteCount()];
                    requestBuffer.read(requestBodyBytes);
                    DataBufferUtils.release(requestBuffer); // Release memory
                    String cachedRequestBody = new String(requestBodyBytes, StandardCharsets.UTF_8);

                    // Create a ServerHttpRequestDecorator to cache the request
                    ServerHttpRequest cachedRequest = new ServerHttpRequestDecorator(request) {
                        @Override
                        public Flux<DataBuffer> getBody() {
                            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(requestBodyBytes);
                            return Flux.just(buffer);
                        }
                    };

                    // Cache the response body
                    ServerHttpResponseDecorator cachedResponse = new ServerHttpResponseDecorator(originalResponse) {
                        @Override
                        public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                            // Collect the response body
                            Flux<? extends DataBuffer> bodyFlux = Flux.from(body);
                            return super.writeWith(bodyFlux.buffer().map(dataBuffers -> {
                                DataBuffer joinedBuffer = exchange.getResponse().bufferFactory().join(dataBuffers);
                                byte[] responseBodyBytes = new byte[joinedBuffer.readableByteCount()];
                                joinedBuffer.read(responseBodyBytes);
                                DataBufferUtils.release(joinedBuffer); // Release memory
                                String cachedResponseBody = new String(responseBodyBytes, StandardCharsets.UTF_8);

                                // You can now log or store `cachedResponseBody` and `cachedRequestBody`
                                System.out.println("Cached Request Body: " + cachedRequestBody);
                                System.out.println("Cached Response Body: " + cachedResponseBody);

                                // Return a DataBuffer that contains the cached response body
                                return exchange.getResponse().bufferFactory().wrap(responseBodyBytes);
                            }));
                        }

                        @Override
                        public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
                            return writeWith(Flux.from(body).flatMapSequential(p -> p));
                        }
                    };

                    return chain.filter(exchange.mutate()
                            .request(cachedRequest)
                            .response(cachedResponse)
                            .build());
                });
    }
}