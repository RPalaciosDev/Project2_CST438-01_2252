package com.group3.chat_api.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class WebSocketHandler extends AbstractWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(WebSocketHandler.class);

    private static Set<WebSocketSession> sessions = new HashSet<>();

    // CONVERT TO ENUM LATER
    private final String USER_CONNECT = "USER_CONNECT";
    private final String USER_DISCONNECT = "USER_DISCONNECT";

    private TextMessage createTextMessage(String messageType, Integer connectionCount) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> payload = new HashMap<>();

        payload.put("type", messageType);
        payload.put("message", connectionCount);

        return new TextMessage(objectMapper.writeValueAsString(payload));
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        log.info("WebSocket Session Opened");
        sessions.add(session);
        sessions.forEach(conn -> {
            try {
                conn.sendMessage(createTextMessage(USER_CONNECT, sessions.size()));
            } catch (IOException e) {
                log.error("Error sending WS connect event: ", e);
                throw new RuntimeException(e);
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
       log.info("WebSocket Session Closed");
       sessions.remove(session);
       sessions.forEach(conn -> {
           try {
               conn.sendMessage(createTextMessage(USER_DISCONNECT, sessions.size()));
           } catch (IOException e) {
              log.error("Error sending WS disconnect event: ", e);
               throw new RuntimeException(e);
           }
       });
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        log.info("WebSocket Message Received {}", message);
        log.info(message.getPayload());
        sessions.forEach(conn -> {
            try {
                if (!conn.getId().equals(session.getId())) {
                    conn.sendMessage(message);
                }
            } catch (IOException e) {
                log.error("Error sending WS message: ", e);
                throw new RuntimeException(e);
            }
        });
    }
}
