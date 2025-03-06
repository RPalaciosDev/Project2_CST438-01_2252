package com.group3.chat_api.repository;

import com.group3.chat_api.model.Conversation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends CrudRepository<Conversation, UUID> {

    List<Conversation> findByParticipantsContaining(String user_id);

    List<Conversation> findByParticipantsContainingAndActive(String user_id);

    Conversation findByConversationId(UUID conversation_id);
}
