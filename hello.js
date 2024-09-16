import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;
import org.slf4j.MDC;

import java.util.Map;
import java.util.concurrent.Callable;

public class RedisWithMDCContext {
    private final RedisReactiveCommands<String, String> redisReactiveCommands;

    public RedisWithMDCContext(RedisReactiveCommands<String, String> redisReactiveCommands) {
        this.redisReactiveCommands = redisReactiveCommands;
    }

    public Mono<String> getValueWithMDC(String key) {
        return Mono.deferContextual(context -> {
            // Capture Reactor Context
            Context reactorContext = context;

            // Capture MDC from the current thread
            Map<String, String> mdcContext = MDC.getCopyOfContextMap();

            // Perform Lettuce operation on its thread pool but propagate Reactor Context and MDC manually
            return Mono.fromCompletionStage(() -> {
                return withMDCContext(mdcContext, () -> redisReactiveCommands.get(key).toFuture());
            })
            .subscribeOn(Schedulers.boundedElastic())  // Use boundedElastic for IO-bound operation
            .contextWrite(reactorContext);             // Restore Reactor Context
        });
    }

    // Helper method to execute the task with MDC context propagation
    private <T> T withMDCContext(Map<String, String> mdcContext, Callable<T> task) throws Exception {
        try {
            // Set MDC context labels (ThreadContext for logging)
            if (mdcContext != null) {
                MDC.setContextMap(mdcContext);
            }
            return task.call();
        } finally {
            // Clear MDC after the task is done to prevent leakage
            MDC.clear();
        }
    }
}