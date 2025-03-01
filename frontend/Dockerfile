FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install ajv and ajv-keywords explicitly with their dependencies
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 json-schema-traverse@1.0.0 fast-deep-equal@3.1.3 json-schema-typed@7.0.3 uri-js@4.4.1

# Install web dependencies
RUN npm install react-native-web@0.19.6 react-dom@18.2.0

# Copy the rest of the application
COPY . .

# Install expo-cli globally
RUN npm install -g expo-cli@6.3.10

# Expose the port
EXPOSE 19006

# Set CI=1 for non-interactive mode
ENV CI=1

# Start the application in web mode
CMD ["npx", "expo", "start", "--web", "--port", "19006"]