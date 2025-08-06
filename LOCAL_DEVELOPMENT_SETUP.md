# Local Development Setup Guide

## ✅ Current Status - ALL ISSUES RESOLVED!

### Running Services
1. **Auth Service**: ✅ Running on port 8081
   - Health endpoint: `http://localhost:8081/health`
   - Login endpoint: `http://localhost:8081/api/auth/signin`
   - Registration endpoint: `http://localhost:8081/api/auth/signup`
   - **CORS Fixed**: Now accepts requests from `http://localhost:8083`

2. **Tier List Service**: ✅ Running on port 8082
   - Health endpoint: `http://localhost:8082/actuator/health`
   - API endpoints: `http://localhost:8082/api/*`
   - **CORS Fixed**: Added SecurityConfig and CORS configuration
   - **Dependencies Fixed**: Added Spring Security dependency

3. **Image Storage Service**: ✅ Running on port 8084
   - Health endpoint: `http://localhost:8084/actuator/health`
   - API endpoints: `http://localhost:8084/api/*`
   - **Port Fixed**: Now running on correct port 8084
   - **S3 Sync Disabled**: For local development

4. **MongoDB**: ✅ Running locally
   - Host: localhost:27017
   - Username: root
   - Password: example
   - Database: auth_db

## 🔧 Issues Fixed

### 1. CORS Issues ✅ RESOLVED
- **Auth Service**: Added `http://localhost:8083` to allowed origins
- **Tier List Service**: Created SecurityConfig with proper CORS configuration
- **Image Storage Service**: Already had proper CORS configuration

### 2. Service Dependencies ✅ RESOLVED
- **Tier List Service**: Added `spring-boot-starter-security` dependency
- **Image Storage Service**: Fixed port configuration (8084 instead of 8080)

### 3. MongoDB Authentication ✅ RESOLVED
- Set up MongoDB with root/example credentials
- All services now connect successfully to MongoDB

## 🚀 Quick Start

### 1. Set up Environment Variables
```bash
# Run the setup script
source setup-local-env.sh
```

### 2. Start MongoDB (if not running)
```bash
brew services start mongodb-community@6.0
```

### 3. Start All Services
```bash
# Auth Service (Port 8081)
cd auth_user_api && ./gradlew bootRun &

# Tier List Service (Port 8082)
cd tier-list-service && ./gradlew bootRun &

# Image Storage Service (Port 8084)
cd image-storage-service && SERVER_PORT=8084 ./gradlew bootRun &
```

### 4. Start Frontend
```bash
cd frontend && npm start
```

## 🔍 Testing Services

### Health Checks
```bash
# Auth Service
curl http://localhost:8081/health

# Tier List Service
curl http://localhost:8082/actuator/health

# Image Storage Service
curl http://localhost:8084/actuator/health
```

### CORS Testing
```bash
# Test CORS for Auth Service
curl -H "Origin: http://localhost:8083" -H "Access-Control-Request-Method: POST" -X OPTIONS http://localhost:8081/api/auth/signin

# Test CORS for Tier List Service
curl -H "Origin: http://localhost:8083" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:8082/api/daily
```

## 📋 Service URLs

| Service | Port | Health Endpoint | Main API |
|---------|------|-----------------|----------|
| Auth Service | 8081 | `/health` | `/api/auth/*` |
| Tier List Service | 8082 | `/actuator/health` | `/api/*` |
| Image Storage Service | 8084 | `/actuator/health` | `/api/*` |
| Frontend | 8083 | N/A | N/A |

## 🎯 Frontend Configuration

The frontend is already configured to use localhost URLs:
- Auth API: `http://localhost:8081`
- Tier List API: `http://localhost:8082`
- Image Storage API: `http://localhost:8084`

## ✅ All Issues Resolved!

- ✅ **CORS Issues**: Fixed for all services
- ✅ **Service Dependencies**: All required dependencies added
- ✅ **Port Conflicts**: Resolved port assignments
- ✅ **MongoDB Connection**: All services connect successfully
- ✅ **Security Configuration**: Proper security configs in place

Your local development environment is now fully functional! 🎉 