package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ConversationResponse;
import com.group3.chat_api.mapper.ConversationManagerMapper;
import com.group3.chat_api.mapper.ConversationMapper;
import com.group3.chat_api.dto.ConversationRequest;
import com.group3.chat_api.model.Conversation;
import com.group3.chat_api.model.ConversationManager;
import com.group3.chat_api.service.ConversationManagerService;
import com.group3.chat_api.service.ConversationService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);
    private final ConversationService conversationService;
    private final ConversationMapper conversationMapper;
    private final ConversationManagerService conversationManagerService;
    private final ConversationManagerMapper conversationManagerMapper;

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

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(
            @RequestBody ConversationRequest conversationRequest,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            log.info("Creating conversation with participants: {}", conversationRequest.getParticipants());

            if (conversationRequest.getParticipants() == null || conversationRequest.getParticipants().isEmpty()) {
                log.error("Cannot create conversation with empty participant list");
                return ResponseEntity.badRequest().build();
            }

            // Create the conversation
            Conversation conversation = conversationService.createConversation(
                    conversationMapper.toEntity(conversationRequest));

            // Add each participant to the conversation manager
            for (String participantId : conversationRequest.getParticipants()) {
                try {
                    // Convert MongoDB ID to UUID
                    UUID participantUuid = getUserUuidFromMongoId(participantId);

                    ConversationManager manager = new ConversationManager();
                    manager.setUserId(participantUuid);
                    manager.setConversationId(conversation.getConversationId());
                    conversationManagerService.addUserToConversation(manager);

                    log.info("Added participant {} (UUID: {}) to conversation {}",
                            participantId, participantUuid, conversation.getConversationId());
                } catch (Exception e) {
                    log.error("Error adding participant {} to conversation: {}", participantId, e.getMessage());
                    // Continue with other participants even if one fails
                }
            }

            return ResponseEntity.ok(conversationMapper.toResponse(conversation));
        } catch (Exception e) {
            log.error("Error creating conversation: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations(@RequestHeader("X-User-Id") UUID userId) {
        try {
            List<UUID> userConversations = conversationManagerService.getAllConversations(userId)
                    .stream()
                    .map(conversationManagerMapper::toConversationId)
                    .toList();
            List<Conversation> conversationList = conversationService.getAllConversations(userConversations);
            if (userConversations.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            return ResponseEntity.ok(
                    conversationList.stream()
                            .map(conversationMapper::toResponse)
                            .toList());
        } catch (Exception e) {
            log.error("Error returning conversation list: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationResponse>> getConversationsByUser(@PathVariable String userId) {
        try {
            log.info("Fetching conversations for user ID: {}", userId);

            // Convert MongoDB ID to UUID
            UUID userUuid;
            try {
                userUuid = getUserUuidFromMongoId(userId);
                log.info("Converted MongoDB ID {} to UUID {}", userId, userUuid);
            } catch (Exception e) {
                log.error("Invalid ID format for user ID: {}", userId, e);
                return ResponseEntity.badRequest().build();
            }

            List<UUID> userConversations = conversationManagerService.getAllConversations(userUuid)
                    .stream()
                    .map(conversationManagerMapper::toConversationId)
                    .toList();

            log.info("Found {} conversations for user ID: {}", userConversations.size(), userId);

            if (userConversations.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<Conversation> conversationList = conversationService.getAllConversations(userConversations);
            return ResponseEntity.ok(
                    conversationList.stream()
                            .map(conversationMapper::toResponse)
                            .toList());
        } catch (Exception e) {
            log.error("Error returning conversation list for user {}: ", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable UUID conversationId,
            @RequestHeader("X-User-Id") UUID userId) {
        try {
            Conversation conversation = conversationService.getConversation(conversationId);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(
                    conversationMapper.toResponse(conversation));
        } catch (Exception e) {
            log.error("Error returning conversation by id: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
