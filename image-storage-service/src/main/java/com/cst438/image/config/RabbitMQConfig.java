package com.cst438.image.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {
    @Value("${spring.data.rabbitmq.host}")
    private String host;

    @Value("${spring.data.rabbitmq.username}")
    private String username;

    @Value("${spring.data.rabbitmq.password}")
    private String password;

    @Value("${spring.data.rabbitmq.port}")
    private int port;

    @Value("${spring.data.rabbitmq.exchange}")
    private String exchange;

    @Value("${spring.data.rabbitmq.auth-queue}")
    private String authQueue;

    @Value("${spring.data.rabbitmq.auth-routing-key}")
    private String authRoutingKey;

    @Bean
    public CachingConnectionFactory connectionFactory() {
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory();
        connectionFactory.setHost(host);
        connectionFactory.setPort(port);
        connectionFactory.setUsername(username);
        connectionFactory.setPassword(password);
        return connectionFactory;
    }

    @Bean
    public Queue authQueue() {
        return new Queue(authQueue);
    }

    @Bean
    public Exchange exchange() {
        return new DirectExchange(exchange);
    }

    @Bean
    public Binding bindingAuth(Queue authQueue, Exchange exchange) {
        return BindingBuilder.bind(authQueue)
                .to(exchange)
                .with(authRoutingKey)
                .noargs();
    }
}
