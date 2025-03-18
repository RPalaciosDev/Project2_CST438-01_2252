package com.group3.chat_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean locked;
}
