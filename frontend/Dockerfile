FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Clean install dependencies with exact versions
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port Expo uses
EXPOSE 19000 19001 19002 19006

# Start the application
CMD ["npm", "start"]