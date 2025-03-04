package com.cst438.image.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        logger.info("SecurityConfig is being loaded!");
        http
            .csrf(csrf -> csrf.disable())  // Updated to work with Spring Security 6
            .authorizeRequests(auth -> auth
                .requestMatchers("/api/images/**").permitAll()  // Allow public access to image endpoints
                .anyRequest().authenticated()
            )
            .httpBasic();  // HTTP Authentication

        return http.build();
    }
}
