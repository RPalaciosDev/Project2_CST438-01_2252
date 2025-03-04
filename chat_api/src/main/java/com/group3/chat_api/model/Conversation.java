package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Table
@Data
@Builder
@Getter
@Setter
public class Conversation {
    @PrimaryKey private UUID conversationId;
    private Set<String> participants;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean active;

    public Conversation() {
    }

    public Conversation(UUID conversationId, Set<String> participants, LocalDateTime createdAt, LocalDateTime expiresAt, Boolean active) {
        this.conversationId = conversationId;
        this.participants = participants;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.active = active;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "conversationId=" + conversationId +
                ", participants=" + participants +
                ", createdAt=" + createdAt +
                ", expiresAt=" + expiresAt +
                ", active=" + active +
                '}';
    }
}
