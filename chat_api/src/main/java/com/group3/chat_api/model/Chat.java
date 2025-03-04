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
@Table
@Data
@Builder
@Getter
@Setter
public class Chat {
    @PrimaryKey private UUID chatId;
    @PrimaryKey private UUID conversationId;
    private UUID senderId;
    private String message;
    @PrimaryKey  private LocalDateTime sendAt;

    @Override
    public String toString() {
        return "Chat{" +
                "chatId=" + chatId +
                ", conversationId=" + conversationId +
                ", senderId=" + senderId +
                ", message='" + message + '\'' +
                ", sendAt=" + sendAt +
                '}';
    }
}
