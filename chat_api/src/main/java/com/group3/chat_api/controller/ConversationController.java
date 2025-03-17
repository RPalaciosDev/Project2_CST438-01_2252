package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ConversationResponse;
import com.group3.chat_api.mapper.ConversationMapper;
import com.group3.chat_api.dto.ConversationRequest;
import com.group3.chat_api.service.ConversationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;
    private final ConversationMapper conversationMapper;

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
        return ResponseEntity.ok(
                conversationService.getAllConversations(userId).stream()
                        .map(conversationMapper::toResponse)
                        .toList()
        );
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable String conversationId,
                                                                @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                conversationMapper.toResponse(
                        conversationService.getConversation(conversationId)
                )
        );
    }
}
