import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

public class WebClientLoggingFilter {

    private static final Logger logger = LoggerFactory.getLogger(WebClientLoggingFilter.class);

    public static ExchangeFilterFunction logRequestAndResponseTime() {
        return (clientRequest, next) -> {
            Instant start = Instant.now();
            logger.info("Request: {} {}", clientRequest.method(), clientRequest.url());

            return next.exchange(clientRequest)
                .doOnNext(clientResponse -> {
                    Instant end = Instant.now();
                    Duration duration = Duration.between(start, end);
                    logger.info("Response: {} {} took {}ms", 
                                clientResponse.statusCode(),
                                clientRequest.url(),
                                duration.toMillis());
                });
        };
    }
}