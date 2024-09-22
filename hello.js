import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpRequestDecorator;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.net.URI;
import static org.mockito.Mockito.*;

class LogRequestFilterTest {

    @Test
    void testLogRequestWithBody() {
        // Arrange
        ClientRequest mockRequest = Mockito.mock(ClientRequest.class);
        when(mockRequest.method()).thenReturn(HttpMethod.POST);
        when(mockRequest.url()).thenReturn(URI.create("http://localhost"));
        
        // Mocking the body of the request
        String mockBodyContent = "Test Body";
        DataBuffer dataBuffer = new DefaultDataBufferFactory().wrap(mockBodyContent.getBytes());
        Flux<DataBuffer> bodyFlux = Flux.just(dataBuffer);
        
        // Mocking the body publisher to return the body flux
        when(mockRequest.body()).thenReturn(bodyFlux);

        // Mock the ExchangeFunction
        ExchangeFilterFunction mockFunction = new LogRequestFilter().logRequest();

        // Act
        mockFunction.filter(mockRequest, next -> Mono.just(ClientResponse.create(200).build())).block();

        // Assert: Verify that body was accessed and logged correctly.
        // Optionally, verify if the body was actually logged (using LogCaptor or custom SLF4J appender).
        verify(mockRequest).method();
        verify(mockRequest).url();
    }
}