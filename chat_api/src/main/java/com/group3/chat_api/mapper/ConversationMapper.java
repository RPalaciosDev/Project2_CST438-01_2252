package com.group3.chat_api.mapper;

import com.group3.chat_api.dto.ConversationRequest;
import com.group3.chat_api.dto.ConversationResponse;
import com.group3.chat_api.model.Conversation;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.UUID;

@Component
public class ConversationMapper {
    public Conversation toEntity(ConversationRequest conversationRequest) {
        HashSet<String> part = new HashSet<>();

        part.add(conversationRequest.getUser1());
        part.add(conversationRequest.getUser2());

        return Conversation.builder()
                .conversationId(UUID.randomUUID())
                .participants(part)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now())
                .active(true)
                .build();
    }

    public ConversationResponse toResponse(Conversation conversation) {
        return ConversationResponse.builder()
                .conversation_id(conversation.getConversationId())
                .participants(conversation.getParticipants())
                .created_at(conversation.getCreatedAt())
                .expires_at(conversation.getExpiresAt())
                .active(conversation.getActive())
                .build();
    }
}
