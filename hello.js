import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.server.ServerHttpResponse;
import org.springframework.web.server.ServerHttpResponseDecorator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class DecoratingServerHttpResponse extends ServerHttpResponseDecorator {

    private DataBuffer capturedDataBuffer = null;

    public DecoratingServerHttpResponse(ServerHttpResponse delegate) {
        super(delegate);
    }

    @Override
    public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
        // Capture response body and delegate write operation
        return Flux.from(body)
            .doOnNext(buffer -> this.capturedDataBuffer = buffer)
            .then(super.writeWith(body));
    }

    public DataBuffer getCapturedDataBuffer() {
        return this.capturedDataBuffer;
    }
}