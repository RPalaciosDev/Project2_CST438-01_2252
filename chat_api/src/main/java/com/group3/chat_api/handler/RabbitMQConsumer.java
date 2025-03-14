package com.group3.chat_api.handler;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQConsumer {
    @RabbitListener(queues = "chat-queue")
    public void receiveMessage(String message) {
        System.out.println(message);
    }
}
