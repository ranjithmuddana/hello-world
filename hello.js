import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

import java.net.URI;

import static org.mockito.Mockito.*;

class LogRequestFilterTest {

    @Test
    void testLogRequestWithBodyInserter() {
        // Arrange
        ClientRequest mockRequest = Mockito.mock(ClientRequest.class);
        when(mockRequest.method()).thenReturn(HttpMethod.POST);
        when(mockRequest.url()).thenReturn(URI.create("http://localhost"));

        // Mocking a BodyInserter (for instance, with a String body)
        BodyInserter<String, ClientHttpRequest> bodyInserter = BodyInserters.fromValue("Test Body");

        // Mock ClientRequest to return the BodyInserter
        when(mockRequest.body()).thenReturn(bodyInserter);

        // Mock the ClientHttpRequest (where BodyInserter will write the body)
        ClientHttpRequest mockClientHttpRequest = Mockito.mock(ClientHttpRequest.class);

        // Capture the DataBuffer written to the request
        ArgumentCaptor<Mono<DataBuffer>> dataBufferCaptor = ArgumentCaptor.forClass(Mono.class);
        when(mockClientHttpRequest.writeWith(dataBufferCaptor.capture())).thenReturn(Mono.empty());

        // Mock the ExchangeFunction
        ExchangeFilterFunction logRequestFilter = new LogRequestFilter().logRequest();

        // Act
        logRequestFilter.filter(mockRequest, next -> {
            // Simulate the BodyInserter writing to the request
            bodyInserter.insert(mockClientHttpRequest, null);
            return Mono.just(ClientResponse.create(200).build());
        }).block();

        // Assert: Verify that the body inserter wrote the body to the request
        verify(mockClientHttpRequest).writeWith(any());

        // Extract and verify the actual body content written to the request
        Mono<DataBuffer> capturedBufferMono = dataBufferCaptor.getValue();
        DataBuffer capturedBuffer = capturedBufferMono.block(); // Block to get the actual DataBuffer
        String bodyContent = StandardCharsets.UTF_8.decode(capturedBuffer.asByteBuffer()).toString();
        assertEquals("Test Body", bodyContent);
    }
}