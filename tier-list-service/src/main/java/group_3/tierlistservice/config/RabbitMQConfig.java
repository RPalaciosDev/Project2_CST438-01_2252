package group_3.tierlistservice.config;

import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queues.tier-list-updates}")
    private String tierListUpdatesQueue;

    @Value("${rabbitmq.queues.user-updates}")
    private String userUpdatesQueue;

    @Value("${rabbitmq.exchanges.tier-list}")
    private String tierListExchange;

    @Value("${rabbitmq.routingKeys.create-tier-list}")
    private String createTierListKey;

    @Value("${rabbitmq.routingKeys.update-tier-list}")
    private String updateTierListKey;

    @Bean
    public Queue tierListUpdatesQueue() {
        return new Queue(tierListUpdatesQueue, true);
    }

    @Bean
    public Queue userUpdatesQueue() {
        return new Queue(userUpdatesQueue, true);
    }

    @Bean
    public TopicExchange tierListExchange() {
        return new TopicExchange(tierListExchange);
    }

    @Bean
    public Binding tierListUpdatesBinding(Queue tierListUpdatesQueue, TopicExchange tierListExchange) {
        return BindingBuilder
                .bind(tierListUpdatesQueue)
                .to(tierListExchange)
                .with("tierlist.*");
    }

    @Bean
    public Binding userUpdatesBinding(Queue userUpdatesQueue, TopicExchange tierListExchange) {
        return BindingBuilder
                .bind(userUpdatesQueue)
                .to(tierListExchange)
                .with("user.*");
    }
}