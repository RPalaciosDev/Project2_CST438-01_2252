package com.group3.chat_api.repository;

import com.group3.chat_api.model.Conversation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConversationRepository extends CrudRepository<Conversation, String> {

    Conversation findByConversationId(UUID conversationId);
}
