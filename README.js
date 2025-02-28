import com.google.cloud.spring.pubsub.core.publisher.PubSubPublisherTemplate;
import com.google.cloud.spring.pubsub.integration.outbound.PubSubMessageHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.support.GenericMessage;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PubSubMessageHandlerTest {

    private static final String TOPIC_NAME = "test-topic";
    
    private PubSubPublisherTemplate mockPublisherTemplate;
    private ByteArrayOutputStream errContent;
    private PrintStream originalErr;

    @BeforeEach
    void setUp() {
        // Mock PubSubPublisherTemplate
        mockPublisherTemplate = Mockito.mock(PubSubPublisherTemplate.class);

        // Capture System.err output for assertions
        errContent = new ByteArrayOutputStream();
        originalErr = System.err;
        System.setErr(new PrintStream(errContent));
    }

    @Test
    void testFailureCallbackTriggered() {
        // Mock failure scenario: return a failed CompletableFuture
        when(mockPublisherTemplate.publish(any(), any(), any()))
                .thenReturn(CompletableFuture.failedFuture(new RuntimeException("Simulated publish failure")));

        // Create the handler
        MessageHandler handler = new PubSubMessageHandler(mockPublisherTemplate, TOPIC_NAME);
        ((PubSubMessageHandler) handler).setFailureCallback((cause, message) -> 
            System.err.println("Failed to publish message: " + cause.getMessage()));

        // Send a test message
        Message<String> message = new GenericMessage<>("Test message");
        handler.handleMessage(message);

        // Verify System.err output
        assertTrue(errContent.toString().contains("Failed to publish message: Simulated publish failure"));
        
        // Restore original System.err
        System.setErr(originalErr);
    }
}