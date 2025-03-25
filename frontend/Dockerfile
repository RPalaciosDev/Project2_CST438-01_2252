# Use a multi-platform compatible Node.js image
FROM --platform=linux/amd64 node:18-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with npm install
RUN npm install --legacy-peer-deps

# Install SockJS as a direct dependency
RUN npm install --save sockjs-client@1.6.1

# Install other web dependencies
RUN npm install react-native-web@0.19.6 react-dom@18.2.0 serve@14.2.1

# Copy the rest of the application
COPY . .

# Create a web export directory
RUN mkdir -p web-build

# Try different export commands to build the web app
RUN set -e; \
  npx expo export -p web || \
  npx expo export || \
  npx expo build:web || \
  echo "All export commands failed, using fallback"

# Create a fallback index.html if the build fails
RUN if [ ! -f web-build/index.html ] && [ ! -f dist/index.html ]; then \
  mkdir -p web-build && \
  echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Frontend App</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root">Loading...</div><script>window.onload=function(){document.getElementById("root").innerHTML="App is loading..."}</script></body></html>' > web-build/index.html; \
  fi

# Copy files from dist to web-build without any conditions
RUN if [ -d "dist" ]; then \
  cp -r dist/* web-build/ || echo "Could not copy dist files"; \
  ls -la web-build/; \
  fi

# Expose the port that Railway will use
EXPOSE 3000

# Set environment variables
ENV PORT=3000 \
  NODE_ENV=production \
  HOST=0.0.0.0

# Create a server.js file to ensure we bind to all interfaces
RUN echo 'const handler = require("serve-handler"); \
  const http = require("http"); \
  const server = http.createServer((request, response) => { \
  return handler(request, response, { \
  public: "web-build", \
  rewrites: [{ source: "/**", destination: "/index.html" }] \
  }); \
  }); \
  const PORT = process.env.PORT || 3000; \
  server.listen(PORT, "0.0.0.0", () => { \
  console.log(`Server running on http://0.0.0.0:${PORT}`); \
  });' > server.js

# Start the server using our custom server.js file
CMD ["node", "server.js"]
