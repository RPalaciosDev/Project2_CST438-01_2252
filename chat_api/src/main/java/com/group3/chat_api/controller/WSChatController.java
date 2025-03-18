package com.group3.chat_api.controller;

import com.group3.chat_api.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class WSChatController {
        @MessageMapping("/sendMessage/{conversationId}")
        @SendTo("/topic/{conversationId}")
        public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
            return chatMessage;
        }

        @MessageMapping("/addUser")
        @SendTo("/topic/public")
        public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
            // Add username in web socket session
            headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
            return chatMessage;
        }
}