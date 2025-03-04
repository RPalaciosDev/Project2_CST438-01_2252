package com.group3.chat_api.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String conversationId;
    private String senderId;
    private String message;
}
