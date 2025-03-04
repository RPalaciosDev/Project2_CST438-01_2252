package com.group3.chat_api.model;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Slf4j
@Getter
@Setter
public class Chat {
    private UUID chat_id;
    private UUID conversation_id;
    private String message;

    @Override
    public String toString() {
        return "Chat{" +
                "chat_id=" + chat_id +
                ", conversation_id=" + conversation_id +
                ", message='" + message + '\'' +
                '}';
    }
}
