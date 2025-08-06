package group_3.auth_user_api.config;

import group_3.auth_user_api.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

@Configuration
@EnableMongoRepositories(basePackages = "group_3.auth_user_api.repository")
@EnableAutoConfiguration(exclude = {
        MongoAutoConfiguration.class,
        MongoDataAutoConfiguration.class
})
public class MongoConfig extends AbstractMongoClientConfiguration {
    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    @Value("${spring.data.mongodb.uri:mongodb://root:example@localhost:27017/auth_service?authSource=admin}")
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
        try {
            return MongoClients.create(mongoUri);
        } catch (Exception e) {
            logger.error("Failed to create MongoDB client: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    protected boolean autoIndexCreation() {
        return true;
    }

    @Bean
    CommandLineRunner initDatabase(MongoTemplate mongoTemplate) {
        return args -> {
            try {
                IndexOperations indexOps = mongoTemplate.indexOps(User.class);

                // Check if the index already exists
                boolean indexExists = indexOps.getIndexInfo().stream()
                        .anyMatch(indexInfo -> indexInfo.getIndexFields().stream()
                                .anyMatch(field -> field.getKey().equals("email")));

                if (!indexExists) {
                    // Ensure email field is unique
                    indexOps.ensureIndex(
                            new Index().on("email", org.springframework.data.domain.Sort.Direction.ASC).unique());
                    logger.info("✅ MongoDB email index created successfully");
                } else {
                    logger.info("ℹ️ MongoDB email index already exists");
                }

                logger.info("✅ MongoDB connection and initialization successful");
            } catch (Exception e) {
                logger.error("❌ Failed to initialize MongoDB: {}", e.getMessage(), e);
                // Log but don't rethrow to prevent application startup failure
            }
        };
    }
}
