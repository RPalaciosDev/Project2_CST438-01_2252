FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000

CMD ["npm", "start"]