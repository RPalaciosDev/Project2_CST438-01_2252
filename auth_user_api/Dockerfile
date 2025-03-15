FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace/app

# Copy gradle files and download dependencies
COPY gradle gradle
COPY build.gradle settings.gradle gradlew ./

# Fix line endings and make gradlew executable
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# Download dependencies but continue if there's an issue
RUN ./gradlew dependencies --no-daemon || echo "Dependencies may have failed, continuing anyway"

# Copy source code
COPY src src
COPY .env* ./

# Build with more detailed logging and skip tests
RUN ./gradlew bootJar --no-daemon -x test --info || (echo "Build failed with --info, retrying with --stacktrace" && ./gradlew bootJar --no-daemon -x test --stacktrace)

# Create a lightweight runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the JAR from the build stage
COPY --from=build /workspace/app/build/libs/*.jar app.jar

# Set permissions on the JAR
RUN chmod 644 app.jar
USER spring:spring

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod

# Run the application with proper memory settings for containerized environments
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-XX:+UseContainerSupport", "-jar", "app.jar"] 