# Project 02: LoveTiers Application

## Overview
This project is a **full-stack web application** using **Spring Boot, MongoDB, Redis, Rocket.Chat, and Nginx** inside **Docker containers**. It allows users to create and manage tier lists with real-time chat functionality.

## Tech Stack
- **Backend:** Spring Boot (Java 21, Gradle)
- **Database:** MongoDB (NoSQL)
- **Cache:** Redis
- **Chat System:** Rocket.Chat
- **Reverse Proxy:** Nginx
- **Containerization:** Docker & Docker Compose

## Features
- User Authentication (OAuth2 with Google login planned)
- Create and manage tier lists
- Store data in MongoDB
- Cache frequent requests using Redis
- Real-time chat via Rocket.Chat
- API requests proxied through Nginx

---

## Getting Started
### Prerequisites
Ensure you have the following installed:
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

### Installation & Running the Project
1. **Clone the Repository**
   ```sh
   git clone https://github.com/your-username/project02-backend.git
   cd project02-backend
   ```

2. **Ensure `.env` file is configured** (optional for secrets)

3. **Build & Start the Containers**
   ```sh
   docker-compose up --build -d
   ```

4. **Verify Services Are Running**
   ```sh
   docker ps
   ```

5. **Access the Application**
   - **Spring Boot API:** `http://localhost/api/hello`
   - **Rocket.Chat:** `http://localhost/chat/`

---

## API Endpoints
### **User Controller** (`/api/users`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET`  | `/hello` | Returns greeting message |
| `POST` | `/cache/{key}/{value}` | Caches a value in Redis |
| `GET`  | `/cache/{key}` | Retrieves cached data |

---

## Docker Containers & Services
### **Docker Compose Services**
| Service | Description | Port |
|---------|------------|------|
| **MongoDB** | NoSQL Database | `27017` |
| **Redis** | Caching system | `6379` |
| **Spring Boot Backend** | API Service | `8080` |
| **Rocket.Chat** | Real-time chat | `3000` |
| **Nginx** | Reverse Proxy | `80` |

### **Stop All Containers**
```sh
docker-compose down
```

---

## Deployment & CI/CD
- Plan to use **GitHub Actions** for CI/CD
- Deployment options: **Heroku, AWS, or DigitalOcean**

---

## Troubleshooting
### **Common Issues & Fixes**
- **Port already in use?**
  ```sh
  docker ps
  docker stop <container_id>
  ```
- **MongoDB/Redis connection issues?**
  ```sh
  docker-compose restart mongo redis
  ```
- **Rocket.Chat not working?**
  - Ensure **MongoDB is running first**
  - Check logs: `docker logs rocketchat`

## License
This project is licensed under the MIT License.

