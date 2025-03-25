package com.group3.chat_api.handler;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class RabbitMQConsumer {
    private static final Logger logger = LoggerFactory.getLogger(RabbitMQConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = "chat-queue")
    public void receiveWSChat(String message) {
        logger.info("Chat Queue: {}", message);
    }

    @RabbitListener(queues = "match")
    public void receiveMatchNotification(String message) {
        try {
            logger.info("Match Queue received: {}", message);

            // Parse the JSON message from RabbitMQ
            Map<String, Object> matchData = objectMapper.readValue(message, Map.class);

            // Extract user_id and match information
            String userId = (String) matchData.get("user_id");
            String matchId = (String) matchData.get("match");

            if (userId != null && matchId != null) {
                // Create a notification payload
                Map<String, Object> notificationPayload = Map.of(
                        "type", "match_notification",
                        "userId", userId,
                        "matchId", matchId,
                        "timestamp", System.currentTimeMillis());

                // Send to a user-specific topic
                messagingTemplate.convertAndSend("/topic/user/" + userId + "/matches", notificationPayload);

                // Also send to the match's topic
                messagingTemplate.convertAndSend("/topic/user/" + matchId + "/matches", notificationPayload);

                logger.info("Sent match notification to WebSocket topics for users {} and {}", userId, matchId);
            } else {
                logger.warn("Invalid match data format: {}", matchData);
            }
        } catch (Exception e) {
            logger.error("Error processing match notification: {}", e.getMessage(), e);
        }
    }
}
