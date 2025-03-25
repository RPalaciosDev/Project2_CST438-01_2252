package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.cql.Ordering;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Table("chat")
@Data
@Builder
@Getter
@Setter
public class Chat {
    private UUID chatId;
    @PrimaryKeyColumn(name = "conversationid", ordinal = 0, type = PrimaryKeyType.CLUSTERED) private UUID conversationId;
    private String senderId;
    private String message;
    @PrimaryKeyColumn(name = "sentat", ordinal = 1, type = PrimaryKeyType.PARTITIONED, ordering = Ordering.DESCENDING) private LocalDateTime sentAt;

    @Override
    public String toString() {
        return "Chat{" +
                "chatId=" + chatId +
                ", conversationId=" + conversationId +
                ", senderId=" + senderId +
                ", message='" + message + '\'' +
                ", sentAt=" + sentAt +
                '}';
    }
}
