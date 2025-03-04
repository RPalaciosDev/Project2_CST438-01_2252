package com.group3.chat_api.repository;

import com.group3.chat_api.model.Conversation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends CrudRepository<Conversation, String> {

    List<Conversation> findByParticipantsContaining(String user_id);

    List<Conversation> findByParticipantsContainingAndActive(String user_id);

    Conversation findByConversationId(String conversation_id);
}
