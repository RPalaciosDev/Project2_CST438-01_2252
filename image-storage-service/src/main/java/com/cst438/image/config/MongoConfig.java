package com.cst438.image.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;

@Configuration
@EnableMongoRepositories(basePackages = "com.cst438.image.repository")
@EnableAutoConfiguration(exclude = {
        MongoAutoConfiguration.class,
        MongoDataAutoConfiguration.class
})
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.host:localhost}")
    private String mongoHost;
    
    @Value("${spring.data.mongodb.port:27017}")
    private int mongoPort;
    
    @Value("${spring.data.mongodb.database:image_storage}")
    private String mongoDatabase;
    
    @Value("${spring.data.mongodb.username:root}")
    private String mongoUsername;
    
    @Value("${spring.data.mongodb.password:example}")
    private String mongoPassword;

    @Override
    protected String getDatabaseName() {
        return mongoDatabase;
    }

    @Override
    public MongoClient mongoClient() {
        String connectionString = String.format("mongodb://%s:%s@%s:%d/%s?authSource=admin", 
            mongoUsername, mongoPassword, mongoHost, mongoPort, mongoDatabase);
        return MongoClients.create(connectionString);
    }

    @Override
    protected boolean autoIndexCreation() {
        return true;
    }
}