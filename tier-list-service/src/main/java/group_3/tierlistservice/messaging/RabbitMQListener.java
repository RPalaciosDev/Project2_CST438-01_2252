package group_3.tierlistservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQListener {
    private static final Logger logger = LoggerFactory.getLogger(RabbitMQListener.class);

    @RabbitListener(queues = "tierlist_queue")
    public void receiveMessage(String message) {
        logger.info("Received message from RabbitMQ: {}", message);
        // Process the message here
    }

    // You can add more listeners for different queues if needed
}