package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ChatRequest;
import com.group3.chat_api.mapper.ChatMapper;
import com.group3.chat_api.mapper.ConversationManagerMapper;
import com.group3.chat_api.mapper.ConversationMapper;
import com.group3.chat_api.model.Chat;
import com.group3.chat_api.model.ChatMessage;
import com.group3.chat_api.service.ChatService;
import com.group3.chat_api.service.ConversationManagerService;
import com.group3.chat_api.service.ConversationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class WSChatController {
    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);
    @Autowired
    private ChatService chatService;
    @Autowired
    private ChatMapper chatMapper;

    @MessageMapping("/sendMessage/{conversationId}")
    @SendTo("/topic/{conversationId}")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        log.info(chatMessage.toString());

        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setConversationId(chatMessage.getConversationId());
        chatRequest.setSenderId(chatMessage.getSender());
        chatRequest.setMessage(chatMessage.getContent());

        chatService.storeChat(chatMapper.toEntity(chatRequest));
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