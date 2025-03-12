package group_3.tier_api.backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

@Configuration
@EnableMongoRepositories(basePackages = "group_3.tier_api.backend.repositories")
@EnableAutoConfiguration(exclude = {
        MongoAutoConfiguration.class,
        MongoDataAutoConfiguration.class
})
public class MongoConfig extends AbstractMongoClientConfiguration {
    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @PostConstruct
    public void logConfig() {
        // Mask the actual password in logs for security
        String maskedUri = mongoUri.replaceAll(":[^:@]+@", ":***@");
        logger.info("MongoDB Configuration initialized with URI: {}", maskedUri);
        logger.info("Database name: {}", getDatabaseName());
        logger.info("Auto-index creation: {}", autoIndexCreation());
    }

    @Override
    protected String getDatabaseName() {
        return "auth_db";
    }

    @Override
    public MongoClient mongoClient() {
        logger.debug("Creating MongoDB client with URI");
        return MongoClients.create(mongoUri);
    }

    @Override
    protected boolean autoIndexCreation() {
        return true;
    }
}