import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.codec.Hints;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

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
            MockClientHttpRequest mockRequest = new MockClientHttpRequest(request.method(), request.url(), bufferFactory);
            
            return bodyInserter.insert(mockRequest, new BodyInserter.Context() {
                @Override
                public List<HttpMessageWriter<?>> messageWriters() {
                    return ExchangeStrategies.withDefaults().messageWriters();
                }

                @Override
                public Optional<ServerRequest> serverRequest() {
                    return Optional.empty();
                }

                @Override
                public Map<String, Object> hints() {
                    return Hints.none();
                }

                @Override
                public void beforeCommit(Supplier<? extends Mono<Void>> action) {
                }

                @Override
                public boolean hasBody() {
                    return true;
                }
            })
            .then(Mono.defer(() -> {
                Flux<DataBuffer> body = mockRequest.getBody();
                return body.reduce(bufferFactory.allocateBuffer(), (previous, current) -> {
                    previous.write(current);
                    DataBufferUtils.release(current);
                    return previous;
                })
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
        private final HttpMethod method;
        private final URI uri;
        private final DataBufferFactory bufferFactory;
        private final Flux<DataBuffer> body;
        private final HttpHeaders headers = new HttpHeaders();

        MockClientHttpRequest(HttpMethod method, URI uri, DataBufferFactory bufferFactory) {
            this.method = method;
            this.uri = uri;
            this.bufferFactory = bufferFactory;
            this.body = Flux.create(sink -> {
                sink.onRequest(n -> {
                    // Do nothing, we're just capturing the body
                });
            });
        }

        @Override
        public DataBufferFactory bufferFactory() {
            return this.bufferFactory;
        }

        @Override
        public HttpHeaders getHeaders() {
            return this.headers;
        }

        @Override
        public HttpMethod getMethod() {
            return this.method;
        }

        @Override
        public URI getURI() {
            return this.uri;
        }

        @Override
        public Flux<DataBuffer> getBody() {
            return body;
        }

        @Override
        public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
            return Flux.from(body).doOnNext(data -> ((Flux<DataBuffer>)this.body).doOnNext(sink -> sink.next(data))).then();
        }

        @Override
        public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
            return Flux.from(body).flatMap(this::writeWith).then();
        }

        @Override
        public Mono<Void> setComplete() {
            return Mono.empty();
        }
    }
}