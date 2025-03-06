package com.cst438.image;

import com.cst438.image.service.StorageService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@SpringBootApplication(scanBasePackages = "com.cst438.image")
public class ImageStorageServiceApplication {

    private final StorageService storageService;

    public ImageStorageServiceApplication(StorageService storageService) {
        this.storageService = storageService;
    }

    public static void main(String[] args) {
        SpringApplication.run(ImageStorageServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        try {
            storageService.syncS3ToMongo();
            System.out.println("S3 images synced to MongoDB on startup.");
        } catch (Exception e) {
            System.err.println("Error syncing S3 images to MongoDB: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
