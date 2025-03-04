package com.group3.chat_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID conversation_id;
    private Set<String> participants;
    private LocalDateTime created_at;
    private LocalDateTime expires_at;
    private Boolean active;
}
