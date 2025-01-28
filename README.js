package com.example.demo;

import com.example.demo.config.PubSubProperties;
import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import com.google.cloud.spring.pubsub.integration.AckMode;
import com.google.cloud.spring.pubsub.integration.inbound.PubSubInboundChannelAdapter;
import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import com.google.cloud.spring.pubsub.support.GcpPubSubHeaders;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.messaging.MessageHandler;

import java.util.ArrayList;
import java.util.List;

@Log4j2
@Configuration
public class PubSubConfig {

    @Autowired
    private PubSubTemplate pubSubTemplate;

    @Autowired
    private PubSubProperties pubSubProperties;

    @Autowired
    private ApplicationContext applicationContext;

    @Bean
    public List<PubSubInboundChannelAdapter> messageChannelAdapters() {
        List<PubSubInboundChannelAdapter> adapters = new ArrayList<>();

        for (PubSubProperties.Subscription subscription : pubSubProperties.getSubscriptions()) {
            DirectChannel inputChannel = new DirectChannel();
            PubSubInboundChannelAdapter adapter =
                new PubSubInboundChannelAdapter(pubSubTemplate, subscription.getName());
            adapter.setOutputChannel(inputChannel);
            adapter.setAckMode(AckMode.valueOf(pubSubProperties.getAckMode()));
            adapter.setAutoStartup(true); // Enables pause/resume functionality

            // Subscribe the specific handler for this subscription
            inputChannel.subscribe(message -> {
                byte[] payload = (byte[]) message.getPayload();
                BasicAcknowledgeablePubsubMessage originalMessage =
                    message.getHeaders().get(GcpPubSubHeaders.ORIGINAL_MESSAGE, BasicAcknowledgeablePubsubMessage.class);
                
                // Resolve and invoke the appropriate handler
                invokeHandler(subscription.getHandler(), payload, originalMessage);
            });

            adapters.add(adapter);
        }

        return adapters;
    }

    private void invokeHandler(String handlerBeanName, byte[] payload, BasicAcknowledgeablePubsubMessage message) {
        Object handlerBean = applicationContext.getBean(handlerBeanName);
        try {
            handlerBean.getClass()
                .getMethod("handleMessage", byte[].class, BasicAcknowledgeablePubsubMessage.class)
                .invoke(handlerBean, payload, message);
        } catch (Exception e) {
            log.error("Failed to invoke handler '{}': {}", handlerBeanName, e.getMessage(), e);
            // Optionally, you can negatively acknowledge or retry the message
        }
    }

    @Bean
    @ServiceActivator(inputChannel = "controlChannel")
    public MessageHandler controlHandler() {
        return message -> {
            String command = new String((byte[]) message.getPayload()).toLowerCase();
            log.info("Control command received: {}", command);
            switch (command) {
                case "pause":
                    // Start of Selection
                    applicationContext.getBeansOfType(PubSubInboundChannelAdapter.class)
                        .values()
                    applicationContext.getBeansOfType(PubSubInboundChannelAdapter.class)
                        .values()
                        .forEach(PubSubInboundChannelAdapter::stop);
                    log.info("All PubSub adapters paused.");
                    break;
                case "resume":
                    // Start of Selection
                    applicationContext.getBeansOfType(PubSubInboundChannelAdapter.class)
                        .values()
                        .forEach(PubSubInboundChannelAdapter::start);
                    log.info("All PubSub adapters resumed.");
                    break;
                default:
                    log.warn("Unknown command: {}", command);
            }
        };
    }
}


package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "pubsub")
@Data
public class PubSubProperties {
    private List<Subscription> subscriptions;
    private String ackMode;

    @Data
    public static class Subscription {
        private String name;
        private String topic;
        private String handler;
    }
} 

package com.example.demo.service;

import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service("subscriptionHandler1")
public class SubscriptionHandler1 {

    public void handleMessage(byte[] payload, BasicAcknowledgeablePubsubMessage message) {
        String msg = new String(payload);
        log.info("Handler1 processing message: " + msg);
        // Implement your processing logic here
        message.ack();
    }
} 

package com.example.demo.service;

import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service("subscriptionHandler2")
public class SubscriptionHandler2 {

    public void handleMessage(byte[] payload, BasicAcknowledgeablePubsubMessage message) {
        String msg = new String(payload);
        log.info("Handler2 processing message: " + msg);
        // Implement your processing logic here
        message.ack();
    }
} 

pubsub:
  ackMode: MANUAL
  subscriptions:
    - name: testSubscription1
      topic: testTopic1
      handler: subscriptionHandler1
    - name: testSubscription2
      topic: testTopic2
      handler: subscriptionHandler2 
