import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.time.Instant;

public class WebClientLoggingFilter {

    public static ExchangeFilterFunction logRequestAndResponseTiming() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            Instant startTime = Instant.now(); // Capture start time
            System.out.println("Request started at: " + startTime);

            return Mono.just(clientRequest)
                .doOnNext(request -> System.out.println("Request URI: " + request.url()))
                .flatMap(req -> {
                    // Pass the start time along with the request
                    return Mono.deferContextual(context -> Mono.just(req)
                        .contextWrite(ctx -> ctx.put("startTime", startTime)));
                });
        }).andThen((clientRequest, next) -> next.exchange(clientRequest)
            .flatMap(clientResponse -> Mono.deferContextual(context -> {
                Instant startTime = context.get("startTime");  // Retrieve start time from context
                Instant endTime = Instant.now();
                long timeTaken = Duration.between(startTime, endTime).toMillis();
                System.out.println("Response received at: " + endTime);
                System.out.println("Time taken: " + timeTaken + " ms");

                return Mono.just(clientResponse);
            }))
        );
    }
}