package com.group3.chat_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID conversationId;
    private String conversationIdString; // String representation for frontend
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean locked;
    private List<String> participants;
}
