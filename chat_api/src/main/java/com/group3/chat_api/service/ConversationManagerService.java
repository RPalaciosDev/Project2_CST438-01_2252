package com.group3.chat_api.service;

import com.group3.chat_api.model.ConversationManager;
import com.group3.chat_api.repository.ConversationManagerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationManagerService {
    private final ConversationManagerRepository conversationManagementRepository;

    public ConversationManager addUserToConversation(ConversationManager conversationManager) {
        return conversationManagementRepository.save(conversationManager);
    }

    public List<ConversationManager> getAllConversations(String userId) {
        try {
            return conversationManagementRepository.findByUserId(userId);
        } catch (Exception e) {
            log.error("Error unable to get all conversations: ", e);
            throw new RuntimeException(e);
        }
    }

    public List<ConversationManager> getConversationById(UUID conversationId) {
        try {
            return conversationManagementRepository.findByConversationId(conversationId);
        } catch (Exception e) {
            log.error("Error unable to get conversations: ", e);
            throw new RuntimeException(e);
        }
    }
}
