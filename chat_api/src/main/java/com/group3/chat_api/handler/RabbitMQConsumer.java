package com.group3.chat_api.handler;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQConsumer {
    @RabbitListener(queues = "match-queue")
    public void receiveMatchMessage(String message) {
        System.out.println("Match Queue: " + message);
    }

    @RabbitListener(queues = "auth-queue")
    public void receiveAuthMessage(String message) {
        System.out.println("Auth Queue: " + message);
    }
}
