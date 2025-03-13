Write-Host "🔧 Targeted AuthController Syntax Fixer"
Write-Host "======================================"

# Find the AuthController.java file
$controllerPath = Get-ChildItem -Path "auth_user_api/src" -Recurse -Filter "AuthController.java" | Select-Object -First 1 -ExpandProperty FullName

if (-not $controllerPath) {
    Write-Host "❌ AuthController.java not found!"
    exit 1
}

Write-Host "📝 Found AuthController.java at: $controllerPath"

# Create a backup
Copy-Item -Path $controllerPath -Destination "${controllerPath}.bak"
Write-Host "📝 Created backup at ${controllerPath}.bak"

# Read the file content
$content = Get-Content -Path $controllerPath -Raw

# Now make targeted fixes to specific issues identified in the compilation errors

# Fix 1: Fix double semicolons
$content = $content -replace "user\.setEmail\(email\);;", "user.setEmail(email);"
$content = $content -replace "user\.setPassword\(encodedPassword\);;", "user.setPassword(encodedPassword);"
$content = $content -replace "user\.setEmail\(email\);;", "user.setEmail(email);"

# Fix 2: Fix malformed catch block at line 267-269
$content = $content -replace "}\s*catch\(\s*\n\s*Exception e\)\s*\n\s*{", "} catch (Exception e) {"

# Fix 3: Fix the ssOrigin annotation
$content = $content -replace "ssOrigin\(origins=`"\*`"\)", "@PostMapping(`"/debug`")`n    @CrossOrigin(origins=`"*`")"

# Fix 4: Fix the Map casting and variable name issue
$content = $content -replace "requestMap = \(Map<\?, \?\s*\) rawRequest; gInfo\.put\(`"map_keys`", requestMap\.keySet\(\)\);", 
                             "requestMap = (Map<?, ?>) rawRequest;`n                debugInfo.put(`"map_keys`", requestMap.keySet());"

# Fix 5: Fix the missing catch block structure
$content = $content -replace "debugInfo\.put\(`"test_user_valid`", true\);\s*}\s*catch \(Exception e\) {\s*", 
                             "debugInfo.put(`"test_user_valid`", true);`n        } catch (Exception e) {`n            "

# Fix 6: Fix the error_type and error_stack section
$content = $content -replace "debugInfo\.put\(`"error_type`", e\.getClass\(\)\.getName\(\)\);\s*debugInfo\.put\(`"error_stack`", e\.getStackTrace\(\)\);\s*}", 
                             "debugInfo.put(`"error_type`", e.getClass().getName());`n            debugInfo.put(`"error_stack`", e.getStackTrace());`n        }`n    "

# Write the fixed content back to the file
Set-Content -Path $controllerPath -Value $content

Write-Host "✅ Applied targeted fixes to AuthController.java"
Write-Host "🏗️ Attempting to build the project..."

# Change to the auth_user_api directory and attempt to build
Set-Location -Path "auth_user_api"
& .\gradlew clean bootJar -x test

# Check if the build was successful
if (Test-Path "build\libs\auth_user_api-0.0.1-SNAPSHOT.jar") {
    Write-Host "✅ Build successful! JAR file created."
    
    # Create a fixed Dockerfile if it doesn't exist
    if (-not (Test-Path "Dockerfile.fixed")) {
        $dockerContent = @"
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace/app

# Copy gradle files and download dependencies
COPY gradle gradle
COPY build.gradle settings.gradle gradlew ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon || echo "Dependencies may have failed, continuing anyway"

# Copy source code
COPY src src
COPY .env* ./

# Build with more detailed logging and skip tests
RUN ./gradlew bootJar --no-daemon -x test --info || (echo "Build failed with --info, retrying with --stacktrace" && ./gradlew bootJar --no-daemon -x test --stacktrace)

# Create a lightweight runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the JAR from the build stage
COPY --from=build /workspace/app/build/libs/*.jar app.jar

# Set permissions on the JAR
RUN chmod 644 app.jar
USER spring:spring

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod

# Run the application with proper memory settings for containerized environments
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-XX:+UseContainerSupport", "-jar", "app.jar"]
"@
        Set-Content -Path "Dockerfile.fixed" -Value $dockerContent
        Write-Host "📝 Created improved Dockerfile at Dockerfile.fixed"
    }
    
    Write-Host "🎉 You can now update your Dockerfile:"
    Write-Host "  1. Rename it: Rename-Item -Path Dockerfile.fixed -NewName Dockerfile"
    Write-Host "  2. Build the Docker image: docker build -t auth-user-api ."
} else {
    Write-Host "❌ Build still failing. More investigation needed."
    Write-Host "Try running the following for more detailed logs:"
    Write-Host "  ./gradlew clean bootJar -x test --stacktrace"
}

Set-Location -Path ".."
Write-Host "======================================" 