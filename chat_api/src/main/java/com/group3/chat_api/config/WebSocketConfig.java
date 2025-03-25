package com.group3.chat_api.config;

import com.group3.chat_api.controller.ConversationController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String allowedOriginsStr = System.getenv("ALLOWED_ORIGINS");
        String[] allowedOrigins;

        if (allowedOriginsStr != null && !allowedOriginsStr.isEmpty()) {
            // Split comma-separated list of allowed origins
            allowedOrigins = allowedOriginsStr.split(",");
            log.info("CORS allowed origins set from environment: {}", allowedOriginsStr);
        } else {
            // Default allowed origins for local development
            allowedOrigins = new String[] {
                    "http://localhost:8080",
                    "http://localhost:8081",
                    "http://localhost:19006",
                    "http://localhost:19000",
                    "https://app.yourdomain.com" // Railway frontend domain
            };
            log.info("Using default CORS allowed origins: {}", Arrays.toString(allowedOrigins));
        }

        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry
                .setApplicationDestinationPrefixes("/chat")
                .enableSimpleBroker("/topic")
                .setTaskScheduler(heartBeatScheduler())
                .setHeartbeatValue(new long[] { 10000L, 10000L });
    }

    @Bean
    public TaskScheduler heartBeatScheduler() {
        return new ThreadPoolTaskScheduler();
    }
}
