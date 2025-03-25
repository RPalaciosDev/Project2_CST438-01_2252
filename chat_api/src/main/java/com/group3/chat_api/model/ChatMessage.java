package com.group3.chat_api.model;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {
    private UUID messageId;
    private MessageType type;
    private String conversationId;
    private String content;
    private String sender;
}