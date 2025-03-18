package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ChatRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class ChatController {

    @MessageMapping("/chat/sendMessage/{convId}")
    public void sendMessageToConvId(
            @Payload ChatRequest chatMessage,
            SimpMessageHeaderAccessor headerAccessor,
            @DestinationVariable("convId") String conversationId) {
//        chatService.sendMessageToConvId(chatMessage, conversationId, headerAccessor);
//        return chatMapper.toResponse(chatMessage);
    }
}
