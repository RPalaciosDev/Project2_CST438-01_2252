package com.group3.chat_api.dto;

import lombok.Data;

@Data
public class ConversationRequest {
    private String participant1;
    private String participant2;
}
