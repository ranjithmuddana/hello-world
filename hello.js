import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

public class WebClientFilter {

    public static ExchangeFilterFunction addContextToRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> 
            Mono.deferContextual(context -> {
                // Add value to context in RequestProcessor
                Context updatedContext = context.put("traceId", "12345");
                return Mono.just(ClientRequest.from(request).build())
                           .contextWrite(updatedContext);
            })
        );
    }

    public static ExchangeFilterFunction readContextFromResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> 
            Mono.deferContextual(context -> {
                // Read value from context in ResponseProcessor
                String traceId = context.getOrDefault("traceId", "default-traceId");
                System.out.println("Trace ID in response: " + traceId);
                return Mono.just(response);
            })
        );
    }
}