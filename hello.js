import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

// ...

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

                        // Create a Flux that emits a single value and then retries indefinitely with a 20-second delay
                        Flux<Long> retryFlux = Flux.just(0L)
                                .delayElements(Duration.ofSeconds(20))
                                .retryWhen(Retry.indefinitely());

                        // Use flatMap to execute the WebClient call on each emitted value of the Flux
                        retryFlux.flatMap(ignore -> {
                            return webClientBuilder.build()
                                    .post()
                                    .uri("http://other-service-url")
                                    .bodyValue(message.getPayload())
                                    .retrieve()
                                    .bodyToMono(Void.class)
                                    .onErrorResume(error -> {
                                        // Handle error here, e.g., log the error
                                        System.err.println("Error sending message: " + error.getMessage());
                                        return Mono.empty(); // Continue processing
                                    });
                        }).subscribe(); // Start the subscription
                    } catch (Exception e) {
                        // Handle any exceptions that occur during processing
                        e.printStackTrace();
                    }
                }
            })
            .get();
}