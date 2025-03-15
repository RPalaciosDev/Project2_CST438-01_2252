package com.group3.chat_api.config;

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

    @Value("${spring.data.rabbitmq.match-queue}")
    private String matchQueue;

    @Value("${spring.data.rabbitmq.auth-queue}")
    private String authQueue;

    @Value("${spring.data.rabbitmq.match-routing-key}")
    private String matchRoutingKey;

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
    public Queue matchQueue() {
        return new Queue(matchQueue);
    }

    @Bean
    public Queue authQueue() {
        return new Queue(authQueue);
    }

    @Bean
    public Exchange exchange() {
        return new DirectExchange("proj2");
    }

    @Bean
    public Binding bindingMatch(Queue matchQueue, Exchange exchange) {
        return BindingBuilder.bind(matchQueue)
                .to(exchange)
                .with(matchRoutingKey)
                .noargs();
    }

    @Bean
    public Binding bindingAuth(Queue authQueue, Exchange exchange) {
        return BindingBuilder.bind(authQueue)
                .to(exchange)
                .with(authRoutingKey)
                .noargs();
    }
}
