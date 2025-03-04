package com.cst438.image;

import com.cst438.image.service.StorageService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.cst438.image")
@EnableMongoRepositories(basePackages = "com.cst438.image.repository") // Ensure MongoDB repositories are enabled
public class ImageStorageServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ImageStorageServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        ApplicationContext context = new AnnotationConfigApplicationContext(ImageStorageServiceApplication.class);
        StorageService storageService = context.getBean(StorageService.class);
        storageService.syncS3ToMongo();
        System.out.println("S3 images synced to MongoDB on startup.");
    }
}
