FROM --platform=${BUILDPLATFORM:-linux/amd64} eclipse-temurin:21-jdk as builder

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

FROM --platform=${TARGETPLATFORM:-linux/amd64} eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
