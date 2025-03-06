#!/bin/bash

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display help message
show_help() {
    echo -e "${CYAN}Cross-Platform Docker Helper${NC}"
    echo -e "This script helps run the project with architecture-specific optimizations."
    echo
    echo -e "Usage: ${YELLOW}./cross-platform-run.sh [COMMAND]${NC}"
    echo
    echo -e "Commands:"
    echo -e "  ${GREEN}up${NC}            Start all services with architecture detection"
    echo -e "  ${GREEN}down${NC}          Stop all services"
    echo -e "  ${GREEN}build${NC}         Build all services with architecture optimization"
    echo -e "  ${GREEN}rebuild${NC}       Force rebuild all services"
    echo -e "  ${GREEN}logs [SERVICE]${NC} View logs (optional: specify service name)"
    echo -e "  ${GREEN}shell [SERVICE]${NC} Open a shell in a container"
    echo -e "  ${GREEN}help${NC}          Show this help message"
}

# Make sure Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed or not in PATH. Please install Docker first.${NC}"
    exit 1
fi

# Detect architecture if not already set
if [ -z "$BUILDPLATFORM" ] || [ -z "$TARGETPLATFORM" ]; then
    HOST_ARCH=$(uname -m)
    case "$HOST_ARCH" in
        x86_64)
            export BUILDPLATFORM="linux/amd64"
            export TARGETPLATFORM="linux/amd64"
            ;;
        aarch64|arm64)
            export BUILDPLATFORM="linux/arm64"
            export TARGETPLATFORM="linux/arm64"
            ;;
        *)
            export BUILDPLATFORM="linux/amd64"
            export TARGETPLATFORM="linux/amd64"
            echo -e "${YELLOW}Unknown architecture $HOST_ARCH, defaulting to amd64${NC}"
            ;;
    esac
    echo -e "${GREEN}Architecture variables set:${NC}"
    echo -e "  BUILDPLATFORM=$BUILDPLATFORM"
    echo -e "  TARGETPLATFORM=$TARGETPLATFORM"
fi

# Handle command
case "$1" in
    up)
        echo -e "${CYAN}Starting services for architecture: $TARGETPLATFORM${NC}"
        # Check if running in production mode
        if [ "$2" == "prod" ]; then
            echo -e "${YELLOW}Starting in PRODUCTION mode...${NC}"
            docker-compose -f docker-compose.prod.yml up -d
        else
            echo -e "${GREEN}Starting in DEVELOPMENT mode...${NC}"
            docker-compose up -d
        fi
        ;;
    down)
        echo -e "${CYAN}Stopping services...${NC}"
        if [ "$2" == "prod" ]; then
            docker-compose -f docker-compose.prod.yml down
        else
            docker-compose down
        fi
        ;;
    build)
        echo -e "${CYAN}Building services for architecture: $TARGETPLATFORM${NC}"
        if [ "$2" == "prod" ]; then
            docker-compose -f docker-compose.prod.yml build
        else
            docker-compose build
        fi
        ;;
    rebuild)
        echo -e "${CYAN}Rebuilding services for architecture: $TARGETPLATFORM${NC}"
        if [ "$3" == "prod" ]; then
            docker-compose -f docker-compose.prod.yml build --no-cache "$2"
        else
            docker-compose build --no-cache "$2"
        fi
        ;;
    logs)
        if [ -z "$2" ]; then
            echo -e "${CYAN}Viewing logs for all services...${NC}"
            docker-compose logs -f
        else
            echo -e "${CYAN}Viewing logs for $2...${NC}"
            docker-compose logs -f "$2"
        fi
        ;;
    shell)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: You must specify a service name to open a shell.${NC}"
            echo -e "${YELLOW}Example: ./cross-platform-run.sh shell frontend${NC}"
            exit 1
        fi
        echo -e "${CYAN}Opening shell in $2 container...${NC}"
        docker-compose exec "$2" sh
        ;;
    help|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

# Create a Windows PowerShell version too
if [ "$1" == "up" ] || [ -z "$1" ]; then
    echo -e "\n${CYAN}Creating Windows PowerShell version...${NC}"
    cat > cross-platform-run.ps1 << 'EOL'
# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color

# Function to display help message
function Show-Help {
    Write-Host "${CYAN}Cross-Platform Docker Helper${NC}"
    Write-Host "This script helps run the project with architecture-specific optimizations."
    Write-Host ""
    Write-Host "Usage: ${YELLOW}.\cross-platform-run.ps1 [COMMAND]${NC}"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  ${GREEN}up${NC}            Start all services with architecture detection"
    Write-Host "  ${GREEN}down${NC}          Stop all services"
    Write-Host "  ${GREEN}build${NC}         Build all services with architecture optimization"
    Write-Host "  ${GREEN}rebuild${NC}       Force rebuild all services"
    Write-Host "  ${GREEN}logs [SERVICE]${NC} View logs (optional: specify service name)"
    Write-Host "  ${GREEN}shell [SERVICE]${NC} Open a shell in a container"
    Write-Host "  ${GREEN}help${NC}          Show this help message"
}

# Make sure Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "${RED}Docker is not installed or not in PATH. Please install Docker first.${NC}"
    exit 1
}

# Detect architecture if not already set
if (-not $env:BUILDPLATFORM -or -not $env:TARGETPLATFORM) {
    $hostArch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
    if ($hostArch -eq "AMD64") {
        $env:BUILDPLATFORM = "linux/amd64"
        $env:TARGETPLATFORM = "linux/amd64"
    } elseif ($hostArch -eq "ARM64") {
        $env:BUILDPLATFORM = "linux/arm64"
        $env:TARGETPLATFORM = "linux/arm64"
    } else {
        $env:BUILDPLATFORM = "linux/amd64"
        $env:TARGETPLATFORM = "linux/amd64"
        Write-Host "${YELLOW}Unknown architecture $hostArch, defaulting to amd64${NC}"
    }
    Write-Host "${GREEN}Architecture variables set:${NC}"
    Write-Host "  BUILDPLATFORM=$($env:BUILDPLATFORM)"
    Write-Host "  TARGETPLATFORM=$($env:TARGETPLATFORM)"
}

# Handle command
$command = $args[0]
switch ($command) {
    "up" {
        Write-Host "${CYAN}Starting services for architecture: $($env:TARGETPLATFORM)${NC}"
        # Check if running in production mode
        if ($args[1] -eq "prod") {
            Write-Host "${YELLOW}Starting in PRODUCTION mode...${NC}"
            docker-compose -f docker-compose.prod.yml up -d
        } else {
            Write-Host "${GREEN}Starting in DEVELOPMENT mode...${NC}"
            docker-compose up -d
        }
    }
    "down" {
        Write-Host "${CYAN}Stopping services...${NC}"
        if ($args[1] -eq "prod") {
            docker-compose -f docker-compose.prod.yml down
        } else {
            docker-compose down
        }
    }
    "build" {
        Write-Host "${CYAN}Building services for architecture: $($env:TARGETPLATFORM)${NC}"
        if ($args[1] -eq "prod") {
            docker-compose -f docker-compose.prod.yml build
        } else {
            docker-compose build
        }
    }
    "rebuild" {
        Write-Host "${CYAN}Rebuilding services for architecture: $($env:TARGETPLATFORM)${NC}"
        if ($args[2] -eq "prod") {
            docker-compose -f docker-compose.prod.yml build --no-cache $args[1]
        } else {
            docker-compose build --no-cache $args[1]
        }
    }
    "logs" {
        if (-not $args[1]) {
            Write-Host "${CYAN}Viewing logs for all services...${NC}"
            docker-compose logs -f
        } else {
            Write-Host "${CYAN}Viewing logs for $($args[1])...${NC}"
            docker-compose logs -f $args[1]
        }
    }
    "shell" {
        if (-not $args[1]) {
            Write-Host "${RED}Error: You must specify a service name to open a shell.${NC}"
            Write-Host "${YELLOW}Example: .\cross-platform-run.ps1 shell frontend${NC}"
            exit 1
        }
        Write-Host "${CYAN}Opening shell in $($args[1]) container...${NC}"
        docker-compose exec $args[1] sh
    }
    { $_ -eq "help" -or $_ -eq $null } {
        Show-Help
    }
    default {
        Write-Host "${RED}Unknown command: $command${NC}"
        Show-Help
        exit 1
    }
}
EOL

    chmod +x cross-platform-run.sh
    chmod +x cross-platform-run.ps1
    echo -e "\n${GREEN}Created both shell and PowerShell scripts for cross-platform Docker helpers${NC}"
fi 