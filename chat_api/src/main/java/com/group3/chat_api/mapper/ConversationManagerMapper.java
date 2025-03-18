package com.group3.chat_api.mapper;

import com.group3.chat_api.dto.ConversationManagerResponse;
import com.group3.chat_api.model.ConversationManager;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ConversationManagerMapper {

    public ConversationManagerResponse toResponse(ConversationManager conversationManager) {
        return ConversationManagerResponse.builder()
                .conversationId(conversationManager.getConversationId())
                .build();
    }

    public UUID toConversationId(ConversationManager conversationManager) {
        return conversationManager.getConversationId();
    }
}
