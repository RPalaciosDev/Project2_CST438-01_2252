#!/bin/bash

# Load environment variables from .env file
if [ -f "../../.env" ]; then
    echo "Loading environment variables from .env file..."
    # Read .env file and export variables, skipping comments and empty lines
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            # Export the variable
            export "$line"
        fi
    done < "../../.env"
    echo "Environment variables loaded successfully"
else
    echo "Warning: .env file not found at ../../.env"
fi

# Start the Spring Boot application
echo "Starting Image Storage Service..."
./gradlew bootRun 