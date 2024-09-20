import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;
import reactor.core.publisher.Hooks;

import javax.annotation.PostConstruct;

public class ReactorContextPropagationConfig {

    @PostConstruct
    public void init() {
        // Enable automatic context propagation on every scheduled task
        Schedulers.onScheduleHook("context-propagation", runnable -> {
            return () -> {
                // Retrieve the context from the current thread
                Context context = Context.of("traceId", "global-trace-id");
                // Run the task with the reactor context
                Hooks.onEachOperator(Operators.lift((scannable, subscriber) -> 
                     subscriber.contextWrite(context)));
                runnable.run();
            };
        });
    }
}