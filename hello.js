import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.time.Instant;

public class WebClientLoggingFilter {

    public static ExchangeFilterFunction logRequestTiming() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            Instant startTime = Instant.now();
            return Mono.just(clientRequest)
                .flatMap(request -> Mono.defer(() -> {
                    // Pass the start time along with the request
                    return Mono.just(request).contextWrite(Context.of(Instant.class, startTime));
                }));
        });
    }

    public static ExchangeFilterFunction logResponseTiming() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            return Mono.defer(() -> {
                // Retrieve the start time from the context
                Instant startTime = clientResponse
                        .currentContext()
                        .getOrDefault(Instant.class, Instant.now()); // Fallback to current time if not found
                Instant endTime = Instant.now();
                long timeTaken = Duration.between(startTime, endTime).toMillis();
                System.out.println("Response received at: " + endTime);
                System.out.println("Time taken: " + timeTaken + " ms");
                return Mono.just(clientResponse);
            });
        });
    }
}