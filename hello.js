import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;
import reactor.core.publisher.Hooks;

import javax.annotation.PostConstruct;

public class ReactorContextPropagationConfig {

    @PostConstruct
    public void init() {
        // Enable context propagation across all scheduled tasks
        Schedulers.onScheduleHook("context-propagation", runnable -> {
            return () -> {
                Context context = Context.of("traceId", "global-trace-id");
                // Propagate context across schedulers
                try {
                    Context.setThreadLocal(context);
                    runnable.run();
                } finally {
                    Context.clearThreadLocal();
                }
            };
        });
    }
}