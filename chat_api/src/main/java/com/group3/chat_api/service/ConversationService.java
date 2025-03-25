package com.group3.chat_api.service;

import com.group3.chat_api.model.Conversation;
import com.group3.chat_api.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;

    public Conversation createConversation(Conversation conversation) {
        conversation.setCreatedAt(LocalDateTime.now());

       // Chat expires one week from creation
        LocalDateTime dt = LocalDateTime.now();
        conversation.setExpiresAt(dt.plusDays(30));

        return conversationRepository.save(conversation);
    }

    public List<Conversation> getAllConversations(List<UUID> conversationIds) {
        try {
            List<Conversation> conversationList = new ArrayList<>();
            for (UUID convoId : conversationIds) {
                Conversation convo = conversationRepository.findByConversationId(convoId);

                if (convo != null) {
                    conversationList.add(convo);
                }
            }
            return conversationList;
        } catch (Exception e) {
            log.error("Error retrieving conversations: ", e);
            throw new RuntimeException(e);
        }
    }

    public Conversation getConversation(UUID conversationId) {
        try {
            return conversationRepository.findByConversationId(conversationId);
        } catch (Exception e) {
            log.error("Error retrieving conversation by id: ", e);
            throw new RuntimeException(e);
        }
    }
}
