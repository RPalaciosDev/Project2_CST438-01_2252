package com.group3.chat_api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ConversationManagerResponse {
    private UUID conversationId;
}
