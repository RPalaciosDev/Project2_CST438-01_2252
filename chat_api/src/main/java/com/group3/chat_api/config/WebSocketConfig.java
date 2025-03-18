package com.group3.chat_api.config;

import com.group3.chat_api.handler.WebSocketHandler;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

   public WebSocketConfig() {}

   @Override
   public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
       registry.addHandler(new WebSocketHandler(), "/ws").setAllowedOrigins("*");
   }

   @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
       ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
       container.setMaxTextMessageBufferSize(8192);
       container.setMaxBinaryMessageBufferSize(8192);
       return container;
   }
}
