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
@Table("conversation")
@Data
@Builder
@Getter
@Setter
public class Conversation {
    @PrimaryKey private UUID conversationId;
    private UUID participant1;
    private UUID participant2;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean locked;

    public Conversation() {
    }

    public Conversation(UUID conversationId, UUID participant1, UUID participant2, LocalDateTime createdAt, LocalDateTime expiresAt, Boolean locked) {
        this.conversationId = conversationId;
        this.participant1 = participant1;
        this.participant2 = participant2;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.locked = locked;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "conversationId=" + conversationId +
                ", participant1=" + participant1 +
                ", participant2=" + participant2 +
                ", createdAt=" + createdAt +
                ", expiresAt=" + expiresAt +
                ", locked=" + locked +
                '}';
    }
}
