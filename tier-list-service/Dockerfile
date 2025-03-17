# Use a multi-platform compatible JDK image with build tools
FROM --platform=linux/amd64 eclipse-temurin:21-jdk-alpine as builder

WORKDIR /app

# Copy gradle files first for better layer caching
COPY gradle gradle
COPY gradlew .
COPY gradlew.bat .
COPY build.gradle .
COPY settings.gradle .

# Fix line endings and permission in case of Windows/Git issues
RUN sed -i 's/\r$//' gradlew && \
    chmod +x gradlew

# Test Gradle wrapper functionality separately
RUN ./gradlew --version || (echo "Gradle wrapper failed to run. Installing Gradle..." && \
    apk add --no-cache gradle && \
    gradle wrapper --gradle-version 8.5 && \
    chmod +x gradlew)

# Now copy source code and build
COPY src src
RUN ./gradlew build -x test --no-daemon

# Use a smaller JRE image for runtime
FROM --platform=linux/amd64 eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set environment variables
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m" \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

