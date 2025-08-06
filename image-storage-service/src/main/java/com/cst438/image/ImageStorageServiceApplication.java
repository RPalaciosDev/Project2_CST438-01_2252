package com.cst438.image;

import com.cst438.image.service.StorageService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.core.env.Environment;

@SpringBootApplication(scanBasePackages = "com.cst438.image") // Marks this as the main Spring Boot application.
@EnableMongoRepositories(basePackages = "com.cst438.image.repository") // Enables MongoDB repositories.
public class ImageStorageServiceApplication {

    private final StorageService storageService;
    private final Environment environment;

    public ImageStorageServiceApplication(StorageService storageService, Environment environment) {
        this.storageService = storageService;
        this.environment = environment;
    }

    public static void main(String[] args) {
        SpringApplication.run(ImageStorageServiceApplication.class, args); // Starts the application.
    }

    @EventListener(ApplicationReadyEvent.class) // Executes after the application is ready.
    public void syncOnStartup() {
        try {
            storageService.syncS3ToMongo(); // Syncs S3 images to MongoDB.
            System.out.println("S3 images synced to MongoDB on startup.");
        } catch (Exception e) {
            System.err.println("Error syncing S3 images to MongoDB: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
