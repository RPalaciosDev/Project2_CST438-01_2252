FROM --platform=${BUILDPLATFORM:-linux/amd64} node:18-alpine as builder

WORKDIR /app

# Install system dependencies including dos2unix for line ending normalization
RUN apk add --no-cache git dos2unix

# Copy package files
COPY package*.json ./

# Set architecture-specific build flags if needed
ARG BUILDPLATFORM
RUN echo "Building on $BUILDPLATFORM"

# Install dependencies with special flags for ARM if needed
RUN if [ "$(uname -m)" = "aarch64" ] || [ "$BUILDPLATFORM" = "linux/arm64" ]; then \
      npm install --legacy-peer-deps --no-optional; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Install ajv and ajv-keywords explicitly with their dependencies
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 json-schema-traverse@1.0.0 fast-deep-equal@3.1.3 json-schema-typed@7.0.3 uri-js@4.4.1

# Install web dependencies
RUN npm install react-native-web@0.19.6 react-dom@18.2.0

# Install expo-cli globally
RUN npm install -g expo-cli@6.3.10

# Copy the rest of the application
COPY . .

# Normalize line endings in all files
RUN find . -type f -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/.git/*" -exec dos2unix {} \;

# Runtime image - use same platform as build to avoid node_modules compatibility issues
FROM --platform=${TARGETPLATFORM:-linux/amd64} node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin/expo /usr/local/bin/expo
COPY --from=builder /usr/local/bin/npx /usr/local/bin/npx

# Expose the port
EXPOSE 19006

# Set CI=1 for non-interactive mode
ENV CI=1

# Start the application in web mode
CMD ["npx", "expo", "start", "--web", "--port", "19006"]