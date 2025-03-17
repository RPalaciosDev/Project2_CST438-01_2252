package com.group3.chat_api.mapper;

import com.group3.chat_api.dto.ChatRequest;
import com.group3.chat_api.dto.ChatResponse;
import com.group3.chat_api.model.Chat;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class ChatMapper {
    public Chat toEntity(ChatRequest chatRequest) {
        return Chat.builder()
                .chatId(UUID.randomUUID())
                .conversationId(UUID.fromString(
                        chatRequest.getConversationId()))
                .senderId(UUID.fromString(
                        chatRequest.getSenderId()))
                .message(chatRequest.getMessage())
                .sentAt(LocalDateTime.now())
                .build();
    }

    public ChatResponse toResponse(Chat chat) {
        return ChatResponse.builder()
                .chatId(chat.getChatId())
                .senderId(chat.getSenderId())
                .message(chat.getMessage())
                .build();
    }
}
