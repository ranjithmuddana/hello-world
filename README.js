package com.example.demo;

import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import com.google.cloud.spring.pubsub.integration.AckMode;
import com.google.cloud.spring.pubsub.integration.inbound.PubSubInboundChannelAdapter;
import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import com.google.cloud.spring.pubsub.support.GcpPubSubHeaders;
import lombok.extern.log4j.Log4j2;
import com.example.demo.config.PubSubProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.channel.PublishSubscribeChannel;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.apache.commons.lang3.StringUtils;
import java.util.ArrayList;
import java.util.List;
@Log4j2
@Configuration
public class PubSubConfig {

    @Autowired
    private PubSubProperties pubSubProperties;

    @Autowired
    private ApplicationContext applicationContext;


    @Bean(name = "messageChannels")
    public List<MessageChannel> messageChannels() {
        List<MessageChannel> messageChannels = new ArrayList<>();
        pubSubProperties.getSubscriptionNames().forEach(subscription -> {
            // Create a new PublishSubscribeChannel for each subscription
            PublishSubscribeChannel channel = new PublishSubscribeChannel();
            String channelName = StringUtils.substringAfterLast(subscription, "/");
            channel.setBeanName(channelName);
            messageChannels.add(channel);
        });
        return messageChannels;
    }

    @Bean(name = "inboundChannelAdapters")
    public List<PubSubInboundChannelAdapter> inboundChannelAdapters(PubSubTemplate pubSubTemplate) {
        List<PubSubInboundChannelAdapter> adapters = new ArrayList<>();
        List<String> subscriptionNames = pubSubProperties.getSubscriptionNames();
        for (int i = 0; i < subscriptionNames.size(); i++) {
            String subscription = subscriptionNames.get(i);
            MessageChannel messageChannel = messageChannels().get(i);  // Get the corresponding channel for this subscription

            log.info("Creating inbound adapter for subscription: {}", subscription);
            // Create the inbound channel adapter for each subscription
            PubSubInboundChannelAdapter adapter = new PubSubInboundChannelAdapter(pubSubTemplate, subscription);
            adapter.setOutputChannel(messageChannel);
            adapter.setAckMode(AckMode.valueOf(pubSubProperties.getAckMode()));
            adapter.setPayloadType(byte[].class);
            adapter.start();
            adapters.add(adapter);
        }
        return adapters;
    }

    @Bean
    public List<MessageHandler> messageHandlers() {
        List<MessageHandler> handlers = new ArrayList<>();
        List<PubSubProperties.Subscription> subscriptions  = pubSubProperties.getSubscriptions();
        for (int i = 0; i < subscriptions.size(); i++) {
            PubSubProperties.Subscription subscription = subscriptions.get(i);
            MessageChannel messageChannel = messageChannels().get(i);  // Get the corresponding channel for this subscription

            // Add logging to ensure the handler is registered
            log.info("Creating handler for subscription: {}", subscription.getName());

            // Create the service activator for each subscription's channel
            MessageHandler handler = message -> {
                byte[] payload = (byte[]) message.getPayload();
                BasicAcknowledgeablePubsubMessage originalMessage = message.getHeaders()
                        .get(GcpPubSubHeaders.ORIGINAL_MESSAGE, BasicAcknowledgeablePubsubMessage.class);

                // Resolve and invoke the appropriate handler
                invokeHandler(subscription.getHandler(), payload, originalMessage);
                
                // Log the payload and acknowledge the message
                log.info("Message arrived from subscription '{}' for handler '{}': Payload: {}", subscription.getName(), subscription.getHandler(), payload);
                originalMessage.ack();
            };

            // Subscribe the handler to the corresponding message channel
            ((PublishSubscribeChannel) messageChannel).subscribe(handler);
            handlers.add(handler);
        }
        return handlers;
    }

    private void invokeHandler(String handlerBeanName, byte[] payload, BasicAcknowledgeablePubsubMessage message) {
        Object handlerBean = applicationContext.getBean(handlerBeanName);
        try {
            handlerBean.getClass()
                .getMethod("handleMessage", byte[].class, BasicAcknowledgeablePubsubMessage.class)
                .invoke(handlerBean, payload, message);
        } catch (Exception e) {
            log.error("Failed to invoke handler '{}': {}", handlerBeanName, e.getMessage(), e);
            // Optionally, you can negatively acknowledge 
        }
    }

}



package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
@ConfigurationProperties(prefix = "app.pubsub")
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

    public List<String> getSubscriptionNames() {
        return subscriptions.stream()
            .map(PubSubProperties.Subscription::getName)
            .collect(Collectors.toList());
    }
} 


    @Autowired
    private List<PubSubInboundChannelAdapter> inboundChannelAdapters;

    @PostMapping("/control-command")
    public String controlCommand(@RequestParam String command) {
        log.info("Control command received: {}", command);
            switch (command) {
                case "pause":
                    inboundChannelAdapters
                        .stream()
                        .filter(adapter -> {
                            log.info("Adapter is running: {}", adapter.getComponentName());
                            return adapter.isRunning();
                        })
                        .forEach(PubSubInboundChannelAdapter::stop);
                    log.info("All PubSub adapters paused.");
                    break;
                case "resume":
                    inboundChannelAdapters
                        .stream()
                        .filter(adapter -> {
                            log.info("Adapter is running: {}", adapter.getBeanName());
                            return !adapter.isRunning();
                        })
                        .forEach(PubSubInboundChannelAdapter::start);
                    log.info("All PubSub adapters resumed.");
                    break;
                default:
                    command = "unknown";
                    log.warn("Unknown command: {}", command);
            }
        return "Executed pubsub control command: " + command;
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


package com.example.demo.service;

import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service("subscriptionHandler3")
public class SubscriptionHandler {

    public void handleMessage(byte[] payload, BasicAcknowledgeablePubsubMessage message) {
        String msg = new String(payload);
        log.info("Handler3 processing message: " + msg);
        // Implement your processing logic here
        message.ack();
    }
} 



app:
  pubsub:
    ackMode: MANUAL
    subscriptions:
      - name: projects/test-1234/subscriptions/sub-1
        handler: subscriptionHandler1
      - name: projects/test-1234/subscriptions/sub-2
        handler: subscriptionHandler2
      - name: projects/test-1234/subscriptions/sub-3
        handler: subscriptionHandler3
      - name: projects/test-1234/subscriptions/sub-4
        handler: subscriptionHandler4
        
