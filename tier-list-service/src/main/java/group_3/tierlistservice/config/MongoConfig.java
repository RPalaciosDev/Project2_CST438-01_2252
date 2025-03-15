package group_3.tierlistservice.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableMongoRepositories(basePackages = "group_3.tierlistservice.repository")
public class MongoConfig extends AbstractMongoClientConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    @Value("${spring.data.mongodb.uri:#{null}}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        logger.info("Using hardcoded database name: tierlist_db");
        return "tier_list_db"; // Always return hardcoded database name
    }

    @Override
    public MongoClient mongoClient() {
        if (mongoUri == null || mongoUri.isEmpty()) {
            logger.error("MongoDB URI is null or empty. Trying environment variables.");

            // Try environment variables as fallback
            String envUri = System.getenv("MONGODB_URL");
            if (envUri == null || envUri.isEmpty()) {
                envUri = System.getenv("MONGODB_URI");
            }

            if (envUri != null && !envUri.isEmpty()) {
                logger.info("Using MongoDB URI from environment");
                return MongoClients.create(envUri);
            }

            logger.error("No MongoDB URI found. Using fallback connection.");
            return MongoClients.create("mongodb://localhost:27017/tierlist_db");
        }

        try {
            logger.info("Creating MongoDB client with URI from application properties");
            return MongoClients.create(mongoUri);
        } catch (Exception e) {
            logger.error("Error creating MongoDB client: {}", e.getMessage());
            return MongoClients.create("mongodb://localhost:27017/tierlist_db");
        }
    }
}