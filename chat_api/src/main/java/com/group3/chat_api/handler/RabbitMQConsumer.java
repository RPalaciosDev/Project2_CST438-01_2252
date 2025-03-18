package com.group3.chat_api.handler;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RabbitMQConsumer {

//    @Autowired
//    public RabbitMQConsumer(TopicWebSocketHandler topicWebSocketHandler) {
//        this.sessionsMap = topicWebSocketHandler.getSessionsMap();
//        this.topicWebSocketHandler = topicWebSocketHandler;
//    }
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = "chat-queue")
    public void receiveWSChat(String message) {
        System.out.println("Chat Queue: " + message);
    }
}
