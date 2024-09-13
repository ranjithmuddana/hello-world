import org.slf4j.MDC;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.Map;

public class ReactorContextMdc {

    public static <T> Mono<T> withMdc(Mono<T> publisher) {
        Map<String, String> mdcContext = MDC.getCopyOfContextMap(); // Copy MDC values
        return publisher
            .contextWrite(Context.of("mdc", mdcContext)) // Add MDC to Reactor's Context
            .doOnEach(signal -> {
                // Set MDC when the reactive chain is running
                if (signal.isOnNext() || signal.isOnError()) {
                    Map<String, String> contextMap = signal.getContextView().getOrDefault("mdc", Map.of());
                    if (contextMap != null) {
                        MDC.setContextMap(contextMap);
                    }
                }
            })
            .doFinally(signal -> MDC.clear()); // Clear MDC at the end of processing
    }
}