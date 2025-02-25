# Use OpenJDK 21 as the base image
FROM openjdk:21-jdk-slim AS build

# Set the working directory
WORKDIR /app

# Copy the Gradle wrapper and project files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Ensure the Gradle wrapper has execute permissions
RUN chmod +x ./gradlew

# Build the application
RUN ./gradlew build --no-daemon

# Use a smaller base image for the runtime
FROM openjdk:21-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
