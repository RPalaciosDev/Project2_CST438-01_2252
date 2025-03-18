package com.group3.chat_api.repository;

import com.group3.chat_api.model.ConversationManager;
import org.springframework.data.cassandra.core.mapping.Table;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@Table("user_conversation")
public interface ConversationManagerRepository extends CrudRepository<ConversationManager, String> {

    List<ConversationManager> findByUserId(UUID userId);
}
