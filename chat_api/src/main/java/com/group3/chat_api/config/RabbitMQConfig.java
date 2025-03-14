package com.group3.chat_api.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    @Bean
    public Queue queue() {
        return new Queue("chat-queue");
    }

    @Bean
    public Exchange exchange() {
        return new DirectExchange("proj2");
    }

    @Bean
    public Binding binding (Queue queue, Exchange exchange) {
        return BindingBuilder.bind(queue)
                .to(exchange)
                .with("routing-key")
                .noargs();
    }
}
