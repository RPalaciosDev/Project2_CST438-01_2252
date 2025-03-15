package com.group3.chat_api.service;

import com.group3.chat_api.model.Conversation;
import com.group3.chat_api.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;

    public Conversation createConversation(Conversation conversation) {
        conversation.setCreatedAt(LocalDateTime.now());

       // Chat expires one week from creation
        LocalDateTime dt = LocalDateTime.now();
        conversation.setExpiresAt(dt.plusDays(7));

        return conversationRepository.save(conversation);
    }

    public List<Conversation> getAllConversations(String userId) {
        return conversationRepository.findByParticipant1OrParticipant2(userId);
    }

    public Conversation getConversation(String conversationId) {
       return conversationRepository.findByConversationId(conversationId);
    }
}
