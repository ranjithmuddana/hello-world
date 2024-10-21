Certainly, I'll provide a complete implementation of the logging filter along with the necessary supporting classes. This will give you a fully functional solution that you can directly use or adapt as needed.



```java
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpResponse;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.function.Consumer;
import java.util.function.Supplier;

public class LoggingExchangeFilterFunction implements ExchangeFilterFunction {

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        return captureRequestBody(request)
                .flatMap(requestBody -> next.exchange(request)
                        .flatMap(response -> captureResponseBody(response, requestBody)));
    }

    private Mono<String> captureRequestBody(ClientRequest request) {
        BodyInserter<?, ? super ClientHttpRequest> bodyInserter = request.body();
        return Mono.defer(() -> {
            CaptureBodyClientHttpRequest bodyCapture = new CaptureBodyClientHttpRequest();
            return bodyInserter.insert(bodyCapture, new NoopContext())
                    .then(Mono.just(bodyCapture.getBody()));
        }).defaultIfEmpty("");
    }

    private Mono<ClientResponse> captureResponseBody(ClientResponse response, String requestBody) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .map(responseBody -> {
                    logRequestResponse(requestBody, responseBody, response.statusCode().value());
                    return ClientResponse
                            .from(response)
                            .body(responseBody)
                            .build();
                });
    }

    private void logRequestResponse(String requestBody, String responseBody, int statusCode) {
        System.out.printf("Request: %s | Response: %s | Status: %d%n",
                requestBody, responseBody, statusCode);
    }
}

class CaptureBodyClientHttpRequest implements ClientHttpRequest {
    private final StringBuilder bodyBuilder = new StringBuilder();

    @Override
    public HttpHeaders getHeaders() {
        return new HttpHeaders();
    }

    @Override
    public DataBuffer bufferFactory() {
        return null;
    }

    @Override
    public void beforeCommit(Supplier<? extends Mono<Void>> action) {
    }

    @Override
    public boolean isCommitted() {
        return false;
    }

    @Override
    public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
        return Flux.from(body)
                .doOnNext(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    bodyBuilder.append(new String(bytes, StandardCharsets.UTF_8));
                })
                .then();
    }

    @Override
    public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
        return writeWith(Flux.from(body).flatMap(p -> p));
    }

    @Override
    public Mono<Void> setComplete() {
        return Mono.empty();
    }

    @Override
    public HttpMethod getMethod() {
        return null;
    }

    @Override
    public URI getURI() {
        return null;
    }

    public String getBody() {
        return bodyBuilder.toString();
    }
}

class NoopContext implements Context {
    @Override
    public <T> T get(Object key) {
        return null;
    }

    @Override
    public boolean hasKey(Object key) {
        return false;
    }

    @Override
    public Context put(Object key, Object value) {
        return this;
    }

    @Override
    public Context delete(Object key) {
        return this;
    }

    @Override
    public <T> T getOrDefault(Object key, T defaultValue) {
        return defaultValue;
    }

    @Override
    public <T> Mono<T> getOrEmpty(Object key) {
        return Mono.empty();
    }

    @Override
    public int size() {
        return 0;
    }

    @Override
    public Context putAll(Context context) {
        return this;
    }

    @Override
    public Stream<Map.Entry<Object, Object>> stream() {
        return Stream.empty();
    }
}

```

This complete implementation includes:

1. `LoggingExchangeFilterFunction`: The main class that implements the `ExchangeFilterFunction` interface. It captures both request and response bodies and logs them along with the status code.

2. `CaptureBodyClientHttpRequest`: A custom implementation of `ClientHttpRequest` that captures the request body.

3. `NoopContext`: A minimal implementation of the `Context` interface.

To use this logging filter, you can add it to your WebClient like this:

```java
WebClient webClient = WebClient.builder()
    .filter(new LoggingExchangeFilterFunction())
    .build();
```

This implementation will log both the request and response bodies, along with the response status code, on a single line for each HTTP interaction.

Here are a few important notes about this implementation:

1. It reads the entire request and response bodies into memory. For very large payloads, you might want to implement size limits or streaming to avoid potential out-of-memory issues.

2. The logging is done using `System.out.printf()`. In a production environment, you'd likely want to use a proper logging framework like SLF4J or Log4j.

3. This implementation doesn't handle multipart requests or binary data specially. You might need to add additional logic if you need to handle these types of requests.

4. The `NoopContext` implementation is very basic. Depending on your use case, you might need to flesh it out more.

5. Error handling is minimal in this example. In a production scenario, you'd want to add more robust error handling and possibly log any exceptions that occur during the request/response cycle.

Would you like me to explain any part of this implementation in more detail or make any further modifications?