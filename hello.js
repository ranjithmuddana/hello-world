import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

// ...

@Autowired
private WebClient.Builder webClientBuilder;

@Bean
public IntegrationFlow messageFlow() {
    return IntegrationFlows.from(pubsubInputChannel())
            .handle(new MessageHandler() {
                @Override
                public void handleMessage(org.springframework.messaging.Message<?> message) throws MessagingException {
                    try {
                        // Process the Pub/Sub message here
                        System.out.println("Received message: " + message.getPayload());

                        // Acknowledge the message immediately
                        AcknowledgablePubsubMessage originalMessage =
                                (AcknowledgablePubsubMessage) message.getPayload();
                        originalMessage.ack();
                        System.out.println("Acknowledged message");

                        // Send the message to another service using WebClient with automatic retry
                        webClientBuilder.build()
                                .post()
                                .uri("http://other-service-url")
                                .bodyValue(message.getPayload())
                                .retrieve()
                                .bodyToMono(Void.class)
                                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(20))) // Retry 3 times with 20 seconds delay
                                .onErrorResume(error -> {
                                    // Handle error here, e.g., log the error
                                    System.err.println("Error sending message: " + error.getMessage());
                                    return Mono.empty(); // Continue processing
                                })
                                .subscribe(); // Start the subscription
                    } catch (Exception e) {
                        // Handle any exceptions that occur during processing
                        e.printStackTrace();
                    }
                }
            })
            .get();
}