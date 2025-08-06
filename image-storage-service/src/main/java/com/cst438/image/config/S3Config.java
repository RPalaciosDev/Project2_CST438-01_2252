package com.cst438.image.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.Optional;

@Configuration // Marks this class as a configuration class.
public class S3Config {

    @Value("${AWS_ACCESS_KEY_ID:local-dev-key}")
    private String accessKey;

    @Value("${AWS_SECRET_ACCESS_KEY:local-dev-secret}")
    private String secretKey;

    @Value("${AWS_S3_REGION:us-east-2}")
    private String region;

    @Bean // Defines a bean for the S3 client.
    @Conditional(S3Condition.class)
    public S3Client s3Client() {
        AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(accessKey, secretKey);

        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                .build();
    }
    
    @Bean // Mock S3Client for local development when real credentials are not available
    @Conditional(MockS3Condition.class)
    public S3Client mockS3Client() {
        // Return a mock S3Client that does nothing
        return S3Client.builder()
                .region(Region.of("us-east-1"))
                .build();
    }
}