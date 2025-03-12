package com.group3.chat_api.config;

import com.group3.chat_api.handler.WebSocketHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Get allowed origins from environment variable or use defaults
        String allowedOriginsStr = System.getenv("ALLOWED_ORIGINS");
        String[] allowedOrigins;

        if (allowedOriginsStr != null && !allowedOriginsStr.isEmpty()) {
            // Split comma-separated list of allowed origins
            allowedOrigins = allowedOriginsStr.split(",");
            logger.info("WebSocket allowed origins set from environment: {}", allowedOriginsStr);
        } else {
            // Default allowed origins for local development
            allowedOrigins = new String[] {
                    "ws://localhost:19006",
                    "ws://localhost:19000",
                    "ws://app.yourdomain.com" // Railway frontend domain
            };
            logger.info("Using default WebSocket allowed origins: {}", Arrays.toString(allowedOrigins));
        }

        registry.addHandler(new WebSocketHandler(), "/ws")
                .setAllowedOrigins(allowedOrigins);

        logger.info("WebSocket handler registered with CORS configuration");
    }
}
