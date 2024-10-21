import org.springframework.http.client.reactive.ClientHttpRequestDecorator;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;
import reactor.core.publisher.Flux;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import java.nio.charset.StandardCharsets;

private ExchangeFilterFunction addRequestToReactorContext() {
    return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {

        // Use a ClientHttpRequestDecorator to intercept the request
        ClientRequest filteredRequest = ClientRequest.from(clientRequest)
                .body((outputMessage, context) -> {
                    return Mono.defer(() -> {
                        // Decorate the original ClientHttpRequest
                        ClientHttpRequestDecorator decorator = new ClientHttpRequestDecorator(outputMessage) {
                            @Override
                            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                                // Capture the request body by buffering it
                                Flux<? extends DataBuffer> bodyFlux = Flux.from(body);
                                return DataBufferUtils.join(bodyFlux)
                                        .flatMap(dataBuffer -> {
                                            byte[] bytes = new byte[dataBuffer.readableByteCount()];
                                            dataBuffer.read(bytes);
                                            DataBufferUtils.release(dataBuffer); // Release buffer

                                            String requestBody = new String(bytes, StandardCharsets.UTF_8);

                                            // Add request details to Reactor's Context
                                            return Mono.deferContextual(ctx -> {
                                                Context updatedContext = ctx.put("requestId", clientRequest.headers().getFirst("X-Request-ID"))
                                                        .put("requestUri", clientRequest.url().toString())
                                                        .put("requestBody", requestBody);
                                                return Mono.from(outputMessage.writeWith(Flux.just(outputMessage.bufferFactory().wrap(bytes))))
                                                        .contextWrite(updatedContext);
                                            });
                                        });
                            }
                        };
                        return decorator.writeWith(clientRequest.body());
                    });
                }).build();

        return Mono.just(filteredRequest);
    });
}