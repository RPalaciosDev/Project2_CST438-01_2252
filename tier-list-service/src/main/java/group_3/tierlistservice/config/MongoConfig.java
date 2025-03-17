package group_3.tierlistservice.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.context.annotation.Bean;
import org.springframework.core.convert.converter.Converter;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

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
     * Configure custom conversions to handle ID formats properly
     */
    @Bean
    @Override
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        // Add converters for String to ObjectId and vice versa
        converters.add(new StringToObjectIdConverter());
        converters.add(new ObjectIdToStringConverter());
        return new MongoCustomConversions(converters);
    }

    /**
     * Converter to transform String to ObjectId
     */
    private static class StringToObjectIdConverter implements Converter<String, ObjectId> {
        @Override
        public ObjectId convert(String source) {
            try {
                return new ObjectId(source);
            } catch (Exception e) {
                // Log the error but don't throw it
                LoggerFactory.getLogger(StringToObjectIdConverter.class)
                        .error("Failed to convert String to ObjectId: {}", source);
                return null;
            }
        }
    }

    /**
     * Converter to transform ObjectId to String
     */
    private static class ObjectIdToStringConverter implements Converter<ObjectId, String> {
        @Override
        public String convert(ObjectId source) {
            return source.toString();
        }
    }
}