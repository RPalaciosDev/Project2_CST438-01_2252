# Use a multi-platform compatible base image
FROM --platform=linux/amd64 eclipse-temurin:21-jdk as builder

WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Ensure Gradle wrapper has execution permissions and build without tests
RUN chmod +x ./gradlew && ./gradlew build -x test

# Use Debian-based JRE instead of Alpine for better compatibility
FROM --platform=linux/amd64 eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# Set environment variables
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m" \
    SPRING_PROFILES_ACTIVE="prod" \
    PORT=8080

# Expose the port (will be set by Railway)
EXPOSE 8080

# Configure the container to run as a non-root user
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --gid 1001 appuser
USER appuser

# Run the jar file with proper configuration
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar -Dserver.port=${PORT} app.jar"]
