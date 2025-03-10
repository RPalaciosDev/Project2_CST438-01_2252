# Use Eclipse Temurin JDK 21 for building the application
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jdk as builder

WORKDIR /app

# Copy Gradle wrapper and project settings
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Give Gradlew execution permissions and build the project (excluding tests)
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# Use a smaller JRE base image for running the application
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR file from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Set environment variables for optimal memory usage
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m"

# Expose the application port
EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
