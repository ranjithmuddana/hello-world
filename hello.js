import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;
import org.slf4j.MDC;

public class ReactorMdcHelper {

    public static void initMdcHooks() {
        Hooks.onEachOperator("mdc-propagation", (scannable, publisher) -> publisher
            .deferContextual(ctx -> {
                Map<String, String> mdcContext = MDC.getCopyOfContextMap();
                return publisher.contextWrite(Context.of("mdc", mdcContext));
            })
            .doOnEach(signal -> {
                if (signal.isOnNext() || signal.isOnError()) {
                    Map<String, String> contextMap = signal.getContextView().getOrDefault("mdc", Map.of());
                    if (contextMap != null) {
                        MDC.setContextMap(contextMap);
                    }
                }
            })
            .doFinally(signal -> MDC.clear()));
    }
}