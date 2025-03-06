package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Table
@Data
@Builder
@Getter
@Setter
public class Chat {
    @PrimaryKeyColumn(name = "chat_id", ordinal = 2, type = PrimaryKeyType.CLUSTERED)
    private UUID chatId;

    @PrimaryKeyColumn(name = "conversation_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID conversationId;

    private UUID senderId;
    private String message;

    @PrimaryKeyColumn(name = "send_at", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    private LocalDateTime sendAt;

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
