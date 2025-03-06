CREATE KEYSPACE IF NOT EXISTS chat_keyspace
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE chat_keyspace;

CREATE TABLE IF NOT EXISTS conversation (
    conversation_id uuid,
    participants set<text>,
    created_at timestamp,
    expires_at timestamp,
    active boolean,
    PRIMARY KEY (conversation_id)
);

CREATE TABLE IF NOT EXISTS chat (
    chat_id uuid,
    conversation_id uuid,
    sender_id uuid,
    message text,
    send_at timestamp,
    PRIMARY KEY ((conversation_id), send_at, chat_id)
) WITH CLUSTERING ORDER BY (send_at DESC, chat_id ASC); 