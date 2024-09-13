import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.http2.client.HTTP2Client;
import org.eclipse.jetty.util.ssl.SslContextFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.JettyClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Signal;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;

import java.util.Map;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() throws Exception {
        // Jetty 12 HttpClient with HTTP/2 support
        SslContextFactory.Client sslContextFactory = new SslContextFactory.Client();
        HTTP2Client http2Client = new HTTP2Client();
        HttpClient httpClient = new HttpClient(http2Client);
        httpClient.setSslContextFactory(sslContextFactory);
        httpClient.start();

        JettyClientHttpConnector connector = new JettyClientHttpConnector(httpClient);

        // Configure WebClient with MDC handling filter
        return WebClient.builder()
                .clientConnector(connector)
                .filter(mdcContextFilter())  // Add the MDC filter to WebClient globally
                .build();
    }

    /**
     * MDC context propagation filter for WebClient.
     * This filter will ensure MDC context is propagated globally for all requests.
     */
    private ExchangeFilterFunction mdcContextFilter() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            // Capture the MDC context at the start of the request
            Map<String, String> contextMap = MDC.getCopyOfContextMap();

            return Mono.just(clientRequest)
                    .doOnEach(signal -> restoreMdcContext(contextMap, signal))
                    .contextWrite(Context.of("mdcContext", contextMap));  // Store MDC in Reactor context
        }).andThen((clientRequest, next) -> next.exchange(clientRequest)
                .doOnEach(signal -> MDC.clear()));  // Clear MDC after the request is complete
    }

    /**
     * Helper method to restore MDC context during reactive execution.
     */
    private void restoreMdcContext(Map<String, String> contextMap, Signal<?> signal) {
        if (signal.isOnNext() || signal.isOnComplete() || signal.isOnError()) {
            if (contextMap != null) {
                // Restore MDC context from the captured map
                MDC.setContextMap(contextMap);
            }
        }
    }

    /**
     * Global hook to propagate the MDC context across reactive chains.
     */
    static {
        Hooks.onEachOperator("MDC", (publisher, subscriber) -> 
            Schedulers.fromExecutor(runnable -> {
                // Wrap each execution with MDC context propagation
                Map<String, String> contextMap = MDC.getCopyOfContextMap();
                return () -> {
                    try {
                        if (contextMap != null) {
                            MDC.setContextMap(contextMap);
                        }
                        runnable.run();
                    } finally {
                        MDC.clear();
                    }
                };
            }).schedule(subscriber::onComplete)
        );
    }
}