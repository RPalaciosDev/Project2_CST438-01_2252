package com.group3.chat_api.mapper;

import com.group3.chat_api.dto.ConversationRequest;
import com.group3.chat_api.dto.ConversationResponse;
import com.group3.chat_api.model.Conversation;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class ConversationMapper {
    public Conversation toEntity(ConversationRequest conversationRequest) {
        return Conversation.builder()
                .conversationId(UUID.randomUUID())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now())
                .locked(false)
                .build();
    }

    public ConversationResponse toResponse(Conversation conversation) {
        return ConversationResponse.builder()
                .conversationId(conversation.getConversationId())
                .createdAt(conversation.getCreatedAt())
                .expiresAt(conversation.getExpiresAt())
                .locked(conversation.getLocked())
                .build();
    }
}
