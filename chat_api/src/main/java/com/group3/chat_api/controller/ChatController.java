package com.group3.chat_api.controller;

import com.group3.chat_api.dto.ChatResponse;
import com.group3.chat_api.mapper.ChatMapper;
import com.group3.chat_api.service.ChatService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final ChatMapper chatMapper;

    @GetMapping
    public ResponseEntity<List<ChatResponse>> getChat(@PathVariable String conversationId,
                                                     @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                chatService.getChats(conversationId).stream()
                        .map(chatMapper::toResponse)
                        .toList()
        );
    }
}
