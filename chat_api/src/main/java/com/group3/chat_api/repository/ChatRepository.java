package com.group3.chat_api.repository;

import com.group3.chat_api.model.Chat;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatRepository extends CrudRepository<Chat, String> {

    List<Chat> findByConversationId(UUID conversationId);
}