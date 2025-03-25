package com.group3.chat_api.dto;

import lombok.Data;
import java.util.List;

@Data
public class ConversationRequest {
    private List<String> participants;
}
