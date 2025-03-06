# Cross-Platform Development Guide

This document outlines best practices and solutions for common issues that arise when developing this project across different operating systems (primarily Windows and macOS/Linux).

## Setup Scripts

The project includes platform-specific setup scripts:

- For macOS/Linux: `setup.sh`
- For Windows: `setup.ps1`

Similarly, for frontend development:
- For macOS/Linux: `frontend.sh`
- For Windows: `frontend.ps1` 

Always use the appropriate script for your operating system.

## Line Endings

Git handles line endings differently between operating systems. We use `.gitattributes` to normalize this, but you might still encounter issues.

### Manual Fix for Line Ending Issues

If you're experiencing strange syntax errors or "command not found" errors in shell scripts:

**On Windows:**
```powershell
# Convert to CRLF (Windows style)
(Get-Content path\to\file.ext) | Set-Content -Encoding UTF8 path\to\file.ext
```

**On macOS/Linux:**
```bash
# Convert to LF (Unix style)
dos2unix path/to/file.ext
```

## File Path Separators

Windows uses backslashes (`\`) while macOS/Linux use forward slashes (`/`) for file paths.

### Best Practices

1. Always use the path utilities provided in `utils/path-utils.js` (for Node.js) or `frontend/src/utils/path-utils.ts` (for React Native).
2. Never hardcode path separators; instead use:
   ```javascript
   // For Node.js
   const { joinPaths } = require('./utils/path-utils');
   const filePath = joinPaths('directory', 'subdirectory', 'file.ext');
   
   // For React Native
   import { joinPaths } from '@/utils/path-utils';
   const filePath = joinPaths('directory', 'subdirectory', 'file.ext');
   ```

## Case Sensitivity

macOS/Linux file systems are case-sensitive by default, while Windows is not. This can cause issues when files are referenced with different capitalization.

### Best Practices

1. Be consistent with file naming conventions (recommended: kebab-case for files, PascalCase for components).
2. Always use exact case when importing files:
   ```javascript
   // GOOD
   import MyComponent from './MyComponent';
   
   // BAD - works on Windows but breaks on macOS/Linux
   import MyComponent from './mycomponent';
   ```

## Cross-Architecture Compatibility

Different CPU architectures (like x86_64/AMD64 and ARM64) require special consideration, especially when using Docker containers or compiling native code.

### Multi-Architecture Docker Builds

Our project now includes enhanced support for building Docker images that work across different CPU architectures:

1. Use the provided multi-architecture build scripts:
   ```bash
   # On macOS/Linux
   ./build-multiarch.sh
   
   # On Windows
   .\build-multiarch.ps1
   ```

2. These scripts use Docker Buildx to create images that work on:
   - x86_64/AMD64 (Intel/AMD processors)
   - ARM64 (Apple M1/M2, AWS Graviton, Raspberry Pi 4)

3. NEW: Automatic architecture detection and configuration:
   ```bash
   # On macOS/Linux
   ./set-arch.sh
   
   # On Windows
   .\set-arch.ps1
   ```
   
4. NEW: Cross-platform Docker helper scripts:
   ```bash
   # Start services (auto-detecting architecture)
   ./cross-platform-run.sh up
   
   # Start production services
   ./cross-platform-run.sh up prod
   
   # Build with architecture optimization
   ./cross-platform-run.sh build
   ```

### Java Considerations

Java runs on a virtual machine, which helps with cross-architecture compatibility. Our Dockerfiles have been enhanced to include:

- Platform-specific build stages using `--platform=${BUILDPLATFORM}` 
- Runtime stages optimized for target architecture with `--platform=${TARGETPLATFORM}`
- Dynamic JVM settings that adapt to available container resources using `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`
- Architecture-aware health checks and configuration

### JavaScript/Node.js Considerations

For Node.js applications with native dependencies:

1. Use architecture-specific installations when needed:
   ```bash
   # For native modules on M1/M2 Macs
   npm install --arch=arm64
   
   # For native modules on Intel/AMD machines
   npm install --arch=x64
   ```

2. Consider using pure JavaScript alternatives to native modules when possible

### Testing on Different Architectures

Always test your changes on different architectures when possible:
- Run the application on both Intel/AMD and ARM-based machines
- Use emulation for testing (e.g., Docker with QEMU)
- Consider CI/CD testing on multiple architectures

## Docker Development with Architecture Support

Using Docker for development provides a consistent environment regardless of the host OS:

```bash
# Start all services with architecture detection
./cross-platform-run.sh up

# Build services optimized for your architecture
./cross-platform-run.sh build

# View logs
./cross-platform-run.sh logs frontend
```

### Docker on Windows

Windows users might encounter some specific issues with Docker:

1. **Path Separators in Volume Mounts**:
   Docker Desktop for Windows will usually handle the path separator conversion automatically, but sometimes explicit configuration is needed:

   ```yaml
   volumes:
     - type: bind
       source: ./frontend  # Use forward slashes even on Windows
       target: /app
   ```

2. **Line Ending Issues in Shell Scripts**:
   Shell scripts in Docker containers expect LF line endings. Our Dockerfiles have been updated to convert line endings using `dos2unix`:

   ```bash
   # Check if a script has incorrect line endings
   file gradlew
   
   # Sample output if problematic:
   # gradlew: ASCII text, with CRLF line terminators
   ```

3. **Windows-Specific Docker Commands**:
   Windows users can use the provided PowerShell script for common Docker operations:
   
   ```powershell
   # Load the Docker command functions
   . .\docker-commands.ps1
   
   # Start development environment
   Start-Development
   
   # View logs for a service
   View-Logs -service "frontend"
   ```

### Docker Volume Paths

To ensure Docker volumes work consistently across platforms:

1. Always use relative paths with forward slashes
2. For named volumes, use the same volume naming convention
3. If using bind mounts, be explicit about the host path:

```yaml
volumes:
  - type: bind
    source: ./data  # Relative path with forward slashes
    target: /app/data
```

## Environment Variables for Cross-Architecture Support

The project now uses environment variables to detect and configure services for different architectures:

```
BUILDPLATFORM=linux/amd64    # or linux/arm64 for ARM-based machines
TARGETPLATFORM=linux/amd64   # or linux/arm64 for ARM-based machines
```

These variables are automatically set by the `set-arch.sh` or `set-arch.ps1` scripts.

### Troubleshooting Architecture Issues

If you encounter architecture-related errors:

1. Check which architecture your images are using:
   ```bash
   docker inspect --format '{{.Architecture}}' project2_cst438-01_2252-frontend:latest
   ```

2. Verify your host architecture:
   ```bash
   # On Linux/macOS
   uname -m
   
   # On Windows PowerShell
   [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
   ```

3. Reset architecture detection:
   ```bash
   # On Linux/macOS
   source ./set-arch.sh
   
   # On Windows
   . .\set-arch.ps1
   ```

4. Try building with specific platform targeting:
   ```bash
   # Force AMD64 build
   TARGETPLATFORM=linux/amd64 ./cross-platform-run.sh rebuild
   ```

## Recommended Tools

- **Git Clients with EOL Handling**: GitHub Desktop, SourceTree
- **Code Editors with EOL Support**: VSCode with "EOL Sequence" indicator
- **Path Management**: Always use Node.js `path` module for server code
- **Docker Desktop**: Works on both Windows and macOS
- **Docker Buildx**: For multi-architecture container builds
- **Architecture Detection**: Use the provided `set-arch.sh` and `cross-platform-run.sh` scripts 