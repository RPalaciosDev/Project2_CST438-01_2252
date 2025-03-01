package com.cst438.image;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.cst438.image.model")
@EnableJpaRepositories("com.cst438.image.repository")
public class ImageStorageServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImageStorageServiceApplication.class, args);
    }
}