# Cross-Platform Development Guide

## Setup Instructions

### Prerequisites

#### Windows
- Docker Desktop for Windows
- Node.js 18 or later
- Java Development Kit (JDK) 21
- Git for Windows (with Git Bash)
- PowerShell 5.0 or later

#### macOS
- Docker Desktop for Mac
- Node.js 18 or later
- Java Development Kit (JDK) 21
- Git
- Terminal

### Initial Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd <project-directory>
```

2. **Run the Setup Script**
```bash
# Using Node.js (recommended for both platforms)
node setup.js

# Alternative platform-specific scripts
# Windows:
.\setup.ps1

# macOS/Linux:
./setup.sh
```

### Common Issues and Solutions

#### Windows-Specific Issues

1. **Line Ending Issues**
```bash
# Configure Git to handle line endings
git config --global core.autocrlf input
```

2. **Permission Issues**
```powershell
# If you encounter permission issues with gradlew
icacls gradlew /grant Everyone:F
```

3. **Docker Volume Mounting**
- Enable "Share Drives" in Docker Desktop settings
- Use Windows paths in .env file: `UPLOAD_DIR=C:/Users/username/uploads`

#### macOS-Specific Issues

1. **Permission Issues**
```bash
# Make scripts executable
chmod +x gradlew
chmod +x setup.sh
```

2. **Docker Volume Mounting**
- Allow Docker Desktop file sharing for project directory
- Use Unix paths in .env file: `UPLOAD_DIR=/Users/username/uploads`

### Development Workflow

1. **Starting the Services**
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d service-name
```

2. **Viewing Logs**
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f service-name
```

3. **Running Tests**
```bash
# Backend services
./gradlew test  # Unix
.\gradlew.bat test  # Windows

# Frontend
npm test
```

### IDE Configuration

#### VS Code
```json
{
  "files.eol": "\n",
  "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

#### IntelliJ IDEA
- Enable "Delegate IDE build/run actions to Gradle"
- Set line endings to "Unix and macOS (\n)"

### Database Connections

#### Local Development
```yaml
# Windows
database:
  url: jdbc:postgresql://localhost:5432/db_name

# macOS
database:
  url: jdbc:postgresql://localhost:5432/db_name
```

### Troubleshooting

1. **Docker Issues**
- Reset Docker Desktop
- Clear Docker cache: `docker system prune -a`

2. **Build Issues**
- Clean build files:
  ```bash
  # Windows
  .\gradlew.bat clean
  # macOS
  ./gradlew clean
  ```

3. **Node.js Issues**
- Clear npm cache:
  ```bash
  npm cache clean --force
  ```

### Best Practices

1. **Path Handling**
- Use relative paths when possible
- Use path.join() in Node.js scripts
- Use forward slashes (/) in configuration files

2. **Environment Variables**
- Use .env files for local configuration
- Keep sensitive data in secrets/
- Use cross-platform paths

3. **Git Configuration**
- Use .gitattributes for line ending management
- Use .gitignore for platform-specific files

4. **Docker Volumes**
- Use named volumes for persistence
- Use bind mounts for development
- Configure proper permissions 