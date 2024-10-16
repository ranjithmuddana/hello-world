import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Bean
public RouterFunction<ServerResponse> actuatorRoutes(Scheduler actuatorScheduler) {
    return route(GET("/actuator/health"), request -> {
        return Mono.fromCallable(() -> {
            // Simulate health check logic
            return "Health is OK";
        }).subscribeOn(actuatorScheduler) // Offload to custom scheduler
        .flatMap(response -> ServerResponse.ok().bodyValue(response));
    });
}