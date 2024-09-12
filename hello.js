import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class WebClientConfig {

    private static final Logger logger = LoggerFactory.getLogger(WebClientConfig.class);

    public WebClient webClient() {
        return WebClient.builder()
                .filter(logRequest())
                .build();
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(this::logRequestDetails);
    }

    private Mono<ClientRequest> logRequestDetails(ClientRequest request) {
        logger.info("Request: {} {}", request.method(), request.url());
        
        BodyInserter<?, ? super ClientHttpRequest> bodyInserter = request.body();
        
        if (bodyInserter.isEmpty()) {
            return Mono.just(request);
        }

        return Mono.defer(() -> {
            DataBufferFactory bufferFactory = new DefaultDataBufferFactory();
            MockClientHttpRequest mockRequest = new MockClientHttpRequest(bufferFactory);
            
            return bodyInserter.insert(mockRequest, new BodyInserter.Context())
                .then(Mono.defer(() -> {
                    Flux<DataBuffer> body = mockRequest.getBody();
                    return DataBufferUtils.join(body)
                        .doOnNext(buffer -> {
                            byte[] bytes = new byte[buffer.readableByteCount()];
                            buffer.read(bytes);
                            DataBufferUtils.release(buffer);
                            String bodyString = new String(bytes, StandardCharsets.UTF_8);
                            logger.info("Request body: {}", bodyString);
                        })
                        .then(Mono.just(request));
                }));
        });
    }

    // Mock implementation of ClientHttpRequest for capturing the body
    private static class MockClientHttpRequest implements ClientHttpRequest {
        private final DataBufferFactory bufferFactory;
        private final Flux<DataBuffer> body = Flux.create(sink -> {
            sink.onRequest(n -> {
                // Do nothing, we're just capturing the body
            });
        });

        MockClientHttpRequest(DataBufferFactory bufferFactory) {
            this.bufferFactory = bufferFactory;
        }

        @Override
        public DataBufferFactory bufferFactory() {
            return this.bufferFactory;
        }

        @Override
        public Flux<DataBuffer> getBody() {
            return body;
        }

        @Override
        public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
            return Mono.from(body).doOnNext(this.body::emit).then();
        }

        @Override
        public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
            return Mono.from(body).flatMap(this::writeWith);
        }

        // Implement other methods of ClientHttpRequest interface as needed
        // ...
    }
}