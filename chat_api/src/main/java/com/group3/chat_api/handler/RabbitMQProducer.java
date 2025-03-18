package com.group3.chat_api.handler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class RabbitMQProducer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @RabbitHandler
    public void sendMessage(String conversationId, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("conversation_id", conversationId);
        payload.put("message", message);
        System.out.println(payload);

        try {
            rabbitTemplate.convertAndSend("proj2.chat", "#", "Test from SB Producer");
        } catch (AmqpException e) {
            log.error("e: ", e);
            throw new RuntimeException(e);
        }
    }
}
