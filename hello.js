import reactor.core.scheduler.Schedulers;
import reactor.core.publisher.Mono;
import org.slf4j.MDC;

public class SchedulerExample {

    public Mono<String> processInScheduler() {
        return Mono.deferContextual(ctx -> {
            Map<String, String> mdcContext = ctx.getOrDefault("mdc", Map.of());
            return Mono.fromCallable(() -> {
                MDC.setContextMap(mdcContext);
                try {
                    // Task logic here
                    String correlationId = MDC.get("correlationId");
                    return "Processed in scheduler with correlation ID: " + correlationId;
                } finally {
                    MDC.clear();
                }
            }).subscribeOn(Schedulers.boundedElastic());
        });
    }
}