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

## Docker Development

Using Docker for development provides a consistent environment regardless of the host OS:

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up frontend auth-service
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

## Environment Variables

Environment variables work differently across platforms.

### Best Practices

1. Always use `.env` files for environment variables
2. For cross-platform scripts, use a library like `dotenv` to load variables

## Node.js Dependencies with Native Code

Some npm packages include native code that must be compiled for the host OS.

### Troubleshooting

If you encounter errors related to native modules:

1. Ensure you have appropriate build tools installed:
   - Windows: Visual Studio Build Tools with C++ development tools
   - macOS: Xcode Command Line Tools (`xcode-select --install`)
   - Linux: `build-essential` package
   
2. Try reinstalling node modules:
   ```bash
   rm -rf node_modules
   npm install
   ```

## Recommended Tools

- **Git Clients with EOL Handling**: GitHub Desktop, SourceTree
- **Code Editors with EOL Support**: VSCode with "EOL Sequence" indicator
- **Path Management**: Always use Node.js `path` module for server code
- **Docker Desktop**: Works on both Windows and macOS 