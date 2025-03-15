package com.group3.chat_api.repository;

import com.group3.chat_api.model.Conversation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends CrudRepository<Conversation, String> {

    List<Conversation> findByParticipant1OrParticipant2(String userId);

    Conversation findByConversationId(String conversationId);
}
