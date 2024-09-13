import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.http2.client.HTTP2Client;
import org.eclipse.jetty.util.ssl.SslContextFactory;
import org.slf4j.MDC;
import org.springframework.http.client.reactive.JettyClientHttpConnector;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

public class WebClientWithGlobalMdcHandler {

    public static void main(String[] args) throws Exception {
        // Jetty 12 HttpClient with HTTP/2 support
        SslContextFactory.Client sslContextFactory = new SslContextFactory.Client();
        HTTP2Client http2Client = new HTTP2Client();
        HttpClient httpClient = new HttpClient(http2Client);
        httpClient.setSslContextFactory(sslContextFactory);
        httpClient.start();

        JettyClientHttpConnector connector = new JettyClientHttpConnector(httpClient);

        // Create WebClient with global MDC handling
        WebClient webClient = WebClient.builder()
                .clientConnector(connector)
                .filter(mdcContextFilter())  // Add the MDC filter to the WebClient
                .build();

        // Example of making a WebClient request
        MDC.put("traceId", "12345");

        webClient.get()
                .uri("https://example.com")
                .retrieve()
                .bodyToMono(String.class)
                .subscribeOn(Schedulers.boundedElastic())
                .doFinally(signalType -> MDC.clear())  // Clear MDC after request is done
                .subscribe(response -> {
                    System.out.println("Response: " + response);
                });

        // Ensure proper shutdown of Jetty HttpClient
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                httpClient.stop();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }));
    }

    /**
     * MDC context propagation filter for WebClient.
     * Copies the current MDC context into the reactive pipeline for each WebClient request.
     */
    private static ExchangeFilterFunction mdcContextFilter() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            // Capture the MDC context at the start of the request
            Map<String, String> contextMap = MDC.getCopyOfContextMap();

            return Mono.just(ClientRequest.from(clientRequest)
                    .build())
                    .doOnEach(signal -> {
                        if (contextMap != null) {
                            // Restore the MDC context in the reactive pipeline
                            MDC.setContextMap(contextMap);
                        }
                    });
        }).andThen((clientRequest, next) -> next.exchange(clientRequest)
                .doFinally(signalType -> MDC.clear())  // Clear MDC after the request is done
        );
    }
}