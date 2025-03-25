package com.group3.chat_api.handler;

import com.group3.chat_api.mapper.ConversationManagerMapper;
import com.group3.chat_api.model.ConversationManager;
import com.group3.chat_api.service.ConversationManagerService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RabbitMQConsumer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    private ConversationManagerService conversationManagerService;
    private ConversationManagerMapper conversationManagerMapper;

    @RabbitListener(queues = "chat-queue")
    public void receiveWSChat(String message) {
        System.out.println("Chat Queue: " + message);
    }

    @RabbitListener(queues = "match-queue")
    public void receiveMatch(String message) {
        try {
            JSONObject jsonObject = new JSONObject(message);
            String username = jsonObject.get("username").toString();
            System.out.println(username);
            System.out.println(jsonObject.toString(2)); // Use toString(int indentFactor) for pretty printing
        } catch (JSONException e) {
            System.err.println("Error parsing JSON string: " + e.getMessage());
        }
    }
}
