package group_3.auth_user_api.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;

@Configuration
@EnableRabbit
public class RabbitMQConfig {
    @Value("${spring.rabbitmq.template.exchange:auth-exchange}")
    private String exchange;

    @Value("${spring.rabbitmq.template.routing-key:auth-routing-key}")
    private String routingKey;

    // Queue name is hardcoded as it's an implementation detail
    private final String AUTH_QUEUE = "auth_queue";

    @Bean
    public Queue authQueue() {
        return QueueBuilder.durable(AUTH_QUEUE)
                .build();
    }

    @Bean
    public DirectExchange exchange() {
        return ExchangeBuilder.directExchange(exchange)
                .durable(true)
                .build();
    }

    @Bean
    public Binding bindingAuth() {
        return BindingBuilder.bind(authQueue())
                .to(exchange())
                .with(routingKey);
    }
}