package group_3.auth_user_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;

@SpringBootApplication
@PropertySources({
        @PropertySource(value = "classpath:cors.properties", ignoreResourceNotFound = true)
})
public class AuthUserApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthUserApiApplication.class, args);
    }

}
