package com.group3.chat_api.model;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;
import org.springframework.data.cassandra.core.mapping.Table;

import java.util.UUID;

@Slf4j
@Table("user_conversation")
@Data
@Builder
@Getter
@Setter
public class ConversationManager {
    @PrimaryKeyColumn(name = "userid", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID userId;
    @PrimaryKeyColumn(name = "conversationid", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    private UUID conversationId;
}
