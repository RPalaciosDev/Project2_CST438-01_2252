package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Table("conversation")
@Data
@Builder
@Getter
@Setter
public class Conversation {
    @PrimaryKey
    private UUID conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean locked;
    private List<String> participants;

    public Conversation() {
    }

    public Conversation(UUID conversationId, LocalDateTime createdAt, LocalDateTime expiresAt, Boolean locked,
            List<String> participants) {
        this.conversationId = conversationId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.locked = locked;
        this.participants = participants;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "conversationId=" + conversationId +
                ", createdAt=" + createdAt +
                ", expiresAt=" + expiresAt +
                ", locked=" + locked +
                ", participants=" + participants +
                '}';
    }
}
