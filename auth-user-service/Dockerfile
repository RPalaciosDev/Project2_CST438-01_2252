FROM eclipse-temurin:21-jdk as builder

WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Fix line endings in gradlew shell script (in case built on Windows)
RUN apt-get update && apt-get install -y dos2unix \
    && dos2unix ./gradlew \
    && chmod +x ./gradlew \
    && ./gradlew build -x test

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-Xmx512m -Xms256m"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
