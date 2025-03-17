package group_3.tierlistservice.config;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import java.util.List;

@Configuration
public class MongoValidator {

    private static final Logger logger = LoggerFactory.getLogger(MongoValidator.class);

    @Bean
    public CommandLineRunner validateMongo(MongoTemplate mongoTemplate) {
        return args -> {
            try {
                logger.info("Validating MongoDB connection...");

                // Ping database
                Document result = mongoTemplate.executeCommand("{ ping: 1 }");
                logger.info("MongoDB connection successful. Result: {}", result.toJson());

                // Get database name
                String dbName = mongoTemplate.getDb().getName();
                logger.info("Connected to database: {}", dbName);

                // List collections
                mongoTemplate.getDb().listCollectionNames().forEach(
                        name -> logger.info("Found collection: {}", name));

                // Count templates
                long templateCount = mongoTemplate.getCollection("tierlist_templates").countDocuments();
                logger.info("Found {} templates in tierlist_templates collection", templateCount);

                // Check for the problematic template ID
                String problematicId = "67d56133c34b7e51aea8211f";
                logger.info("Attempting to find template with ID: {}", problematicId);

                // Log all collections first
                logger.info("All collections in database:");
                mongoTemplate.getDb().listCollectionNames().forEach(
                        name -> logger.info(" - Collection: {}", name));

                // Try directly listing documents in tierlist_templates
                logger.info("Documents in tierlist_templates collection:");
                mongoTemplate.getCollection("tierlist_templates").find().limit(5).forEach(
                        doc -> logger.info(" - Document: {}", doc.toJson()));

                // Try with string ID
                Document templateWithStringId = mongoTemplate.getCollection("tierlist_templates")
                        .find(new Document("_id", problematicId))
                        .first();

                // Initialize the ObjectId version variable
                Document templateWithObjId = null;

                if (templateWithStringId != null) {
                    logger.info("Found template with string ID {}: {}", problematicId, templateWithStringId.toJson());
                } else {
                    logger.warn("Template with string ID {} NOT FOUND, trying with ObjectId", problematicId);

                    // Try with ObjectId
                    try {
                        ObjectId objId = new ObjectId(problematicId);
                        templateWithObjId = mongoTemplate.getCollection("tierlist_templates")
                                .find(new Document("_id", objId))
                                .first();

                        if (templateWithObjId != null) {
                            logger.info("Found template with ObjectId {}: {}", problematicId,
                                    templateWithObjId.toJson());
                        } else {
                            logger.error("Template with ID {} NOT FOUND with either String or ObjectId in database {}",
                                    problematicId, dbName);

                            // Try in other collection
                            logger.info("Trying in 'templates' collection as fallback");
                            Document templateInOtherCollection = mongoTemplate.getCollection("templates")
                                    .find(new Document("_id", problematicId))
                                    .first();

                            if (templateInOtherCollection != null) {
                                logger.info("Found template in 'templates' collection: {}",
                                        templateInOtherCollection.toJson());
                            } else {
                                logger.error("Template not found in 'templates' collection either");
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error when trying with ObjectId: {}", e.getMessage());
                    }
                }

                // If template not found, create a test template and try again
                if (templateWithStringId == null
                        && (templateWithObjId == null || !templateWithObjId.containsKey("_id"))) {
                    logger.info("Creating a test template to verify database access");
                    try {
                        // Create a test document
                        Document testTemplate = new Document()
                                .append("userId", "test-user-123")
                                .append("title", "Test Template")
                                .append("description", "This is a test template created by MongoValidator")
                                .append("createdAt", new java.util.Date())
                                .append("updatedAt", new java.util.Date())
                                .append("viewCount", 0)
                                .append("tags", List.of("test", "validator"))
                                .append("imageIds", List.of());

                        // Insert the test document
                        mongoTemplate.getCollection("tierlist_templates").insertOne(testTemplate);
                        String testId = testTemplate.getObjectId("_id").toHexString();
                        logger.info("Created test template with ID: {}", testId);

                        // Try to fetch it back
                        Document createdTemplate = mongoTemplate.getCollection("tierlist_templates")
                                .find(new Document("_id", new ObjectId(testId)))
                                .first();

                        if (createdTemplate != null) {
                            logger.info("Successfully retrieved created test template: {}", createdTemplate.toJson());
                        } else {
                            logger.error("Failed to retrieve test template right after creation!");
                        }
                    } catch (Exception e) {
                        logger.error("Error creating test template: {}", e.getMessage(), e);
                    }
                }
            } catch (Exception e) {
                logger.error("MongoDB validation failed: {}", e.getMessage(), e);
            }
        };
    }
}