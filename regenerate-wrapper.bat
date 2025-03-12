@echo off
echo Downloading and installing Gradle...
powershell -Command "& { Invoke-WebRequest -Uri https://services.gradle.org/distributions/gradle-8.5-bin.zip -OutFile gradle.zip }"
echo Extracting Gradle...
powershell -Command "& { Expand-Archive -Path gradle.zip -DestinationPath . -Force }"

echo Generating Gradle wrapper in image-storage-service...
cd image-storage-service
..\gradle-8.5\bin\gradle wrapper

echo Done! The wrapper has been regenerated.
echo You can now try building your Docker image again.
pause 