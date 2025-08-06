package com.cst438.image.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

public class MockS3Condition implements Condition {
    
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        // Get AWS credentials from environment
        String accessKey = context.getEnvironment().getProperty("AWS_ACCESS_KEY_ID");
        String secretKey = context.getEnvironment().getProperty("AWS_SECRET_ACCESS_KEY");
        
        // Provide mock S3Client when real AWS credentials are not available
        return accessKey == null || accessKey.equals("local-dev-key") ||
               secretKey == null || secretKey.equals("local-dev-secret");
    }
} 