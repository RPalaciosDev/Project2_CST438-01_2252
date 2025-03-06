# Use a multi-platform compatible JDK image
FROM --platform=linux/amd64 eclipse-temurin:21-jdk as builder

WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Ensure Gradle wrapper has execution permissions and build the project
RUN chmod +x ./gradlew && ./gradlew build -x test

# Use Debian-based JRE instead of Alpine for better compatibility
FROM --platform=linux/amd64 eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# Set environment variables
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
