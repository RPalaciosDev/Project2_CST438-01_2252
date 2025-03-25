package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ConversationResponse;
import com.group3.chat_api.mapper.ConversationManagerMapper;
import com.group3.chat_api.mapper.ConversationMapper;
import com.group3.chat_api.dto.ConversationRequest;
import com.group3.chat_api.model.Conversation;
import com.group3.chat_api.service.ConversationManagerService;
import com.group3.chat_api.service.ConversationService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {
    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);
    private final ConversationService conversationService;
    private final ConversationMapper conversationMapper;
    private final ConversationManagerService conversationManagerService;
    private final ConversationManagerMapper conversationManagerMapper;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@RequestBody ConversationRequest conversationRequest,
                                                                   @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                conversationMapper.toResponse(
                        conversationService.createConversation(
                                conversationMapper.toEntity(conversationRequest)
                        )
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations(@RequestHeader("X-User-Id") String userId) {
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
                            .toList()
            );
        } catch (Exception e) {
            log.error("Error returning conversation list: ", e);
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
                    conversationMapper.toResponse(conversation)
            );
        } catch (Exception e) {
            log.error("Error returning conversation by id: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
