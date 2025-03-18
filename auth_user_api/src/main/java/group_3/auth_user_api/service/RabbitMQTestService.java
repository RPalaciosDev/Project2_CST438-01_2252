package group_3.auth_user_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RabbitMQTestService {
    private static final Logger logger = LoggerFactory.getLogger(RabbitMQTestService.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${spring.rabbitmq.template.exchange}")
    private String exchange;

    @Value("${spring.rabbitmq.template.routing-key}")
    private String routingKey;

    public RabbitMQTestService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendTestMessage(String message) {
        try {
            logger.info("Attempting to send test message to RabbitMQ: {}", message);
            logger.info("Using exchange: {}, routing key: {}", exchange, routingKey);
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            logger.info("Test message sent successfully");
        } catch (Exception e) {
            logger.error("Failed to send test message to RabbitMQ", e);
            throw e;
        }
    }
}