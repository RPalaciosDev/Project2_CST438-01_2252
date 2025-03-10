# Use a multi-platform compatible Gradle image for building
FROM --platform=linux/amd64 gradle:8.5-jdk21 AS builder

WORKDIR /app
COPY . .

# Build the application using Gradle
RUN gradle build -x test

# Use JRE for the runtime image
FROM --platform=linux/amd64 eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# Set minimal environment variables (Railway will provide the rest via env vars)
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m" \
    SPRING_PROFILES_ACTIVE="prod" \
    SPRING_MAIN_ALLOW_BEAN_DEFINITION_OVERRIDING=true \
    PORT=8080

# Expose the port (will be set by Railway)
EXPOSE 8080

# Configure the container to run as a non-root user
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --gid 1001 appuser
USER appuser

# Run the jar file with proper configuration
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar -Dserver.port=${PORT} app.jar"]
