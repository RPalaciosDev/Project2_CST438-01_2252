package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ChatRequest;
import com.group3.chat_api.dto.ChatResponse;
import com.group3.chat_api.mapper.ChatMapper;
import com.group3.chat_api.model.Chat;
import com.group3.chat_api.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);
    private final ChatService chatService;
    private final ChatMapper chatMapper;

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<ChatResponse>> getChat(@PathVariable UUID conversationId,
                                                      @RequestHeader("X-User-Id") UUID userId) {
        try {
            List<Chat> chatList = chatService.getChats(conversationId);

            if (chatList.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            return ResponseEntity.ok(chatList.stream()
                    .map(chatMapper::toResponse)
                    .toList()
                    );
        } catch (Exception e) {
            log.error("Error retrieving chats by id: ", e);
            throw new RuntimeException(e);
        }
    }

    @MessageMapping("/chat/sendMessage/{convId}")
    public void sendMessageToConvId(
            @Payload ChatRequest chatMessage,
            SimpMessageHeaderAccessor headerAccessor,
            @DestinationVariable("convId") String conversationId) {
//        chatService.sendMessageToConvId(chatMessage, conversationId, headerAccessor);
//        return chatMapper.toResponse(chatMessage);
    }
}
