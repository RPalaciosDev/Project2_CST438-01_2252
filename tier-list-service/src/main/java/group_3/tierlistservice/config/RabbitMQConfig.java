package group_3.tierlistservice.config;

import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queues.template-updates}")
    private String templateUpdatesQueue;

    @Value("${rabbitmq.queues.item-updates}")
    private String itemUpdatesQueue;

    @Value("${rabbitmq.exchanges.tierlist}")
    private String tierlistExchange;

    @Value("${rabbitmq.routingKeys.create-template}")
    private String createTemplateKey;

    @Value("${rabbitmq.routingKeys.update-template}")
    private String updateTemplateKey;

    @Value("${rabbitmq.routingKeys.create-item}")
    private String createItemKey;

    @Value("${rabbitmq.routingKeys.update-item}")
    private String updateItemKey;

    @Bean
    public Queue templateUpdatesQueue() {
        return new Queue(templateUpdatesQueue, true);
    }

    @Bean
    public Queue itemUpdatesQueue() {
        return new Queue(itemUpdatesQueue, true);
    }

    @Bean
    public TopicExchange tierlistExchange() {
        return new TopicExchange(tierlistExchange);
    }

    @Bean
    public Binding templateUpdatesBinding(Queue templateUpdatesQueue, TopicExchange tierlistExchange) {
        return BindingBuilder
                .bind(templateUpdatesQueue)
                .to(tierlistExchange)
                .with("template.*");
    }

    @Bean
    public Binding itemUpdatesBinding(Queue itemUpdatesQueue, TopicExchange tierlistExchange) {
        return BindingBuilder
                .bind(itemUpdatesQueue)
                .to(tierlistExchange)
                .with("item.*");
    }
}