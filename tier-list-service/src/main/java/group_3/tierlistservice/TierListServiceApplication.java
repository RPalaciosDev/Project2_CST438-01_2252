package group_3.tierlistservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the Tier List Service.
 * 
 * This service manages tierlist templates and tierlist items:
 * - Templates contain metadata and references to items
 * - Items are reusable entities that can be associated with multiple templates
 * 
 * The service provides REST APIs for CRUD operations on both templates and
 * items,
 * and uses MongoDB for data storage.
 */
@SpringBootApplication
public class TierListServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TierListServiceApplication.class, args);
    }

}