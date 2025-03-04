package com.group3.chat_api.service;

import com.group3.chat_api.model.Chat;
import com.group3.chat_api.repository.ChatRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;

    public List<Chat> getChats(String conversationId) {
        return chatRepository.findByConversationId(conversationId);
    }
}
