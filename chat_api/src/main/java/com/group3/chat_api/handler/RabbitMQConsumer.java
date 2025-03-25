package com.group3.chat_api.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group3.chat_api.model.Conversation;
import com.group3.chat_api.model.ConversationManager;
import com.group3.chat_api.service.ConversationManagerService;
import com.group3.chat_api.service.ConversationService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class RabbitMQConsumer {
    private final Logger log = LoggerFactory.getLogger(RabbitMQConsumer.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationService conversationService;
    private final ConversationManagerService conversationManagerService;
    private final ObjectMapper objectMapper;

    public RabbitMQConsumer(SimpMessagingTemplate messagingTemplate,
            ConversationService conversationService,
            ConversationManagerService conversationManagerService) {
        this.messagingTemplate = messagingTemplate;
        this.conversationService = conversationService;
        this.conversationManagerService = conversationManagerService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Map a user's MongoDB ObjectID to a consistent UUID for Cassandra
     * This is needed because MongoDB and Cassandra use different ID formats
     * 
     * @param mongoObjectId The MongoDB ObjectID (24-character hex string)
     * @return A UUID that is consistently generated from the ObjectID
     */
    private UUID getUserUuidFromMongoId(String mongoObjectId) {
        try {
            // For consistent UUIDs based on MongoDB IDs, we'll use a simple approach:
            // If the ID is a valid UUID, use it directly
            try {
                return UUID.fromString(mongoObjectId);
            } catch (IllegalArgumentException e) {
                // Not a UUID, so generate one using the string hash
                String paddedId = mongoObjectId;
                // Ensure we have enough characters to form a UUID
                while (paddedId.length() < 32) {
                    paddedId += mongoObjectId;
                }

                // Format as UUID string (8-4-4-4-12 format)
                String uuidStr = paddedId.substring(0, 8) + "-" +
                        paddedId.substring(8, 12) + "-" +
                        paddedId.substring(12, 16) + "-" +
                        paddedId.substring(16, 20) + "-" +
                        paddedId.substring(20, 32);

                UUID uuid = UUID.fromString(uuidStr);
                log.info("Mapped MongoDB ID {} to UUID {}", mongoObjectId, uuid);
                return uuid;
            }
        } catch (Exception e) {
            log.error("Error mapping MongoDB ID to UUID: {}", e.getMessage());
            // Fallback to a name-based UUID (version 3) from the string
            return UUID.nameUUIDFromBytes(mongoObjectId.getBytes());
        }
    }

    @RabbitListener(queues = "${rabbitmq.queue.match}")
    public void consumeMatch(String message) {
        try {
            log.info("Match Queue received: {}", message);
            JsonNode rootNode = objectMapper.readTree(message);
            String userId = rootNode.path("user_id").asText();
            String matchId = rootNode.path("match").asText();

            // Create conversation automatically for matches
            createConversationForMatch(userId, matchId);

            // Send WebSocket notifications to both users
            sendMatchNotification(userId, matchId);
        } catch (Exception e) {
            log.error("Error processing match message: {}", e.getMessage());
        }
    }

    private void createConversationForMatch(String userId, String matchId) {
        try {
            log.info("Creating conversation for match: {} and {}", userId, matchId);

            // Convert MongoDB IDs to UUIDs
            UUID userUuid = getUserUuidFromMongoId(userId);
            UUID matchUuid = getUserUuidFromMongoId(matchId);

            // Create a new conversation with both participants
            Conversation conversation = Conversation.builder()
                    .conversationId(UUID.randomUUID())
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(30))
                    .locked(false)
                    .build();

            // Save the conversation
            Conversation savedConversation = conversationService.createConversation(conversation);
            log.info("Created conversation: {}", savedConversation.getConversationId());

            // Now add both users to the conversation manager
            ConversationManager userManager = new ConversationManager();
            userManager.setUserId(userUuid);
            userManager.setConversationId(savedConversation.getConversationId());
            conversationManagerService.addUserToConversation(userManager);

            ConversationManager matchManager = new ConversationManager();
            matchManager.setUserId(matchUuid);
            matchManager.setConversationId(savedConversation.getConversationId());
            conversationManagerService.addUserToConversation(matchManager);

            log.info("Successfully added both users to conversation {}", savedConversation.getConversationId());
        } catch (Exception e) {
            log.error("Failed to create conversation for match: {}", e.getMessage());
        }
    }

    private void sendMatchNotification(String userId, String matchId) {
        // Create match notification payload
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("userId", userId);
        userPayload.put("matchId", matchId);

        Map<String, Object> matchPayload = new HashMap<>();
        matchPayload.put("userId", matchId);
        matchPayload.put("matchId", userId);

        // Send to both users' topics
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/matches", userPayload);
        messagingTemplate.convertAndSend("/topic/user/" + matchId + "/matches", matchPayload);

        log.info("Sent match notification to WebSocket topics for users {} and {}", userId, matchId);
    }
}
