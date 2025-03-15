package group_3.tierlistservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient imageServiceWebClient() {
        // Hardcoded URL to avoid property resolution issues
        return WebClient.builder()
                .baseUrl("https://imageapi-production-af11.up.railway.app")
                .build();
    }
}