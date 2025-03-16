package group_3.tierlistservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient imageServiceWebClient() {
        // Update URL to match the frontend environment variable
        return WebClient.builder()
                .baseUrl("https://image-storage-service-production.up.railway.app")
                .build();
    }
}