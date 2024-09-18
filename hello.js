import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;
import org.slf4j.MDC;

import static org.mockito.Mockito.*;

public class LoggingContextWebFilterTest {

    private LoggingContextWebFilter loggingContextWebFilter;

    @Mock
    private ServerWebExchange exchange;

    @Mock
    private WebFilterChain chain;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        loggingContextWebFilter = new LoggingContextWebFilter();
    }

    @Test
    public void testFilterAddsMDCAndContext() {
        // Mock request properties
        when(exchange.getRequest()).thenReturn(mockRequest());

        // Mock the filter chain to return an empty Mono (as the real processing)
        when(chain.filter(exchange)).thenReturn(Mono.empty());

        // Execute the filter
        Mono<Void> filterResult = loggingContextWebFilter.filter(exchange, chain);

        // Verify that Reactor context has MDC properties and the filter chain proceeds
        StepVerifier.create(filterResult)
                .expectSubscription()
                .verifyComplete();

        // Ensure that the chain was invoked
        verify(chain, times(1)).filter(exchange);

        // Check that MDC properties were set
        assertEquals("mock-request-id", MDC.get("requestId"));
        assertEquals("mock-uri", MDC.get("requestUri"));

        // After completion, MDC should be cleared
        assertNull(MDC.get("requestId"));
        assertNull(MDC.get("requestUri"));
    }

    @Test
    public void testFilterContextPropagation() {
        // Mock request properties
        when(exchange.getRequest()).thenReturn(mockRequest());

        // Mock the filter chain
        when(chain.filter(exchange)).thenReturn(Mono.deferContextual(ctx -> {
            // Verify that Reactor Context has expected MDC properties
            assertEquals("mock-request-id", ctx.get("requestId"));
            assertEquals("mock-uri", ctx.get("requestUri"));
            return Mono.empty();
        }));

        // Execute the filter
        Mono<Void> filterResult = loggingContextWebFilter.filter(exchange, chain);

        // Verify Reactor Context is propagated correctly
        StepVerifier.create(filterResult)
                .expectSubscription()
                .verifyComplete();

        // Ensure that the chain was invoked
        verify(chain, times(1)).filter(exchange);
    }

    // Mocking the request
    private ServerHttpRequest mockRequest() {
        ServerHttpRequest request = mock(ServerHttpRequest.class);
        when(request.getId()).thenReturn("mock-request-id");
        when(request.getURI()).thenReturn(URI.create("mock-uri"));
        return request;
    }
}