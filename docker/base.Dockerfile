# Base Java service image (Supports multi-arch for ARM/Mac)
FROM --platform=linux/amd64 eclipse-temurin:17-jdk as builder

WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Ensure Gradle wrapper has execution permission
RUN chmod +x ./gradlew && ./gradlew build -x test

# Use Debian-based image for better compatibility
FROM --platform=linux/amd64 eclipse-temurin:17-jre

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# Common environment variables
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
