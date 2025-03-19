package group_3.tierlistservice.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

@Configuration
@EnableMongoRepositories(basePackages = "group_3.tierlistservice.repository")
public class MongoConfig extends AbstractMongoClientConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    @Value("${spring.data.mongodb.uri:#{null}}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        logger.info("Using database name: tier_list_db");
        return "tier_list_db"; // Using consistent name with underscore
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
            return MongoClients.create("mongodb://localhost:27017/tier_list_db");
        }

        try {
            logger.info("Creating MongoDB client with URI from application properties");
            return MongoClients.create(mongoUri);
        } catch (Exception e) {
            logger.error("Error creating MongoDB client: {}", e.getMessage());
            return MongoClients.create("mongodb://localhost:27017/tier_list_db");
        }
    }

    /**
     * Override the default MappingMongoConverter to fix conversion issues
     */
    @Bean
    public MappingMongoConverter mappingMongoConverter() {
        logger.info("Creating custom MappingMongoConverter without ObjectId conversion for strings");
        MongoMappingContext mappingContext = new MongoMappingContext();
        mappingContext.setAutoIndexCreation(true);
        
        // Create a converter that doesn't try to convert strings to ObjectId
        MappingMongoConverter converter = new MappingMongoConverter(
                NoOpDbRefResolver.INSTANCE, mappingContext);
        
        // Don't convert underscore to dot in map keys
        converter.setMapKeyDotReplacement("_");
        
        // Use empty custom conversions to prevent automatic conversions
        converter.setCustomConversions(new MongoCustomConversions(Collections.emptyList()));
        converter.afterPropertiesSet();
        
        return converter;
    }
}