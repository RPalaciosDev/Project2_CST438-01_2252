package group_3.tierlistservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${services.image-storage.url}")
    private String imageServiceUrl;

    @Bean
    public WebClient imageServiceWebClient() {
        return WebClient.builder()
                .baseUrl(imageServiceUrl)
                .build();
    }
}