package group_3.tierlistservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {
    @Value("${spring.rabbitmq.template.exchange}")
    private String exchange;

    @Value("${spring.rabbitmq.template.routing-key}")
    private String routingKey;

    // Queue name is hardcoded as it's an implementation detail
    private final String TIERLIST_QUEUE = "tierlist_queue";

    @Bean
    public Queue tierlistQueue() {
        return QueueBuilder.durable(TIERLIST_QUEUE)
                .build();
    }

    @Bean
    public DirectExchange exchange() {
        return ExchangeBuilder.directExchange(exchange)
                .durable(true)
                .build();
    }

    @Bean
    public Binding bindingTierlist() {
        return BindingBuilder.bind(tierlistQueue())
                .to(exchange())
                .with(routingKey);
    }
}