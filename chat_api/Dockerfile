# Use OpenJDK with full Gradle installation
FROM gradle:8.5-jdk21-alpine AS builder

WORKDIR /app

# Copy the project files
COPY . .

# Run Gradle commands directly (with detailed logging)
RUN gradle bootJar --no-daemon -x test --info

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the built JAR
COPY --from=builder /app/build/libs/*.jar app.jar

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Set environment variables
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m" \
    SPRING_PROFILES_ACTIVE="prod" \
    PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]