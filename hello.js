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
                .doOnNext(request -> System.out.println("Request started at: " + startTime));
        });
    }

    public static ExchangeFilterFunction logResponseTiming() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            Instant startTime = Instant.now();
            return Mono.defer(() -> {
                Instant endTime = Instant.now();
                long timeTaken = Duration.between(startTime, endTime).toMillis();
                System.out.println("Response received at: " + endTime);
                System.out.println("Time taken: " + timeTaken + " ms");
                return Mono.just(clientResponse);
            });
        });
    }
}