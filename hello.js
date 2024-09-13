import org.apache.logging.log4j.ThreadContext;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

public class ResponseLoggingFilter {

    public static ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            String startTimeStr = ThreadContext.get("startTime"); // Retrieve startTime from ThreadContext
            if (startTimeStr != null) {
                Instant startTime = Instant.ofEpochMilli(Long.parseLong(startTimeStr));
                Instant endTime = Instant.now();
                long timeTaken = Duration.between(startTime, endTime).toMillis();
                System.out.println("Response received at: " + endTime);
                System.out.println("Time taken: " + timeTaken + " ms");
            }
            ThreadContext.remove("startTime"); // Clean up after response
            return Mono.just(clientResponse);
        });
    }
}