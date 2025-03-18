package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Table("conversation")
@Data
@Builder
@Getter
@Setter
public class Conversation {
    @PrimaryKey private UUID conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean locked;

    public Conversation() {
    }

    public Conversation(UUID conversationId, LocalDateTime createdAt, LocalDateTime expiresAt, Boolean locked) {
        this.conversationId = conversationId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.locked = locked;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "conversationId=" + conversationId +
                ", createdAt=" + createdAt +
                ", expiresAt=" + expiresAt +
                ", locked=" + locked +
                '}';
    }
}
