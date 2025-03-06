# Docker commands for Windows PowerShell users
# This script provides handy commands for working with Docker in this project

# Text colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$CYAN = "`e[36m"
$RED = "`e[31m"
$NC = "`e[0m"  # No Color
$MAGENTA = "`e[35m"

function Show-DockerCommands {
    Write-Host "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    Write-Host "${CYAN}║                LoveTiers Docker Commands           ║${NC}"
    Write-Host "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    
    Write-Host "${YELLOW}Available commands:${NC}"
    Write-Host "  ${GREEN}Start-Development${NC} - Start all services in development mode"
    Write-Host "  ${GREEN}Start-Production${NC} - Start all services in production mode"
    Write-Host "  ${GREEN}Stop-Docker${NC} - Stop all running containers"
    Write-Host "  ${GREEN}Clean-Docker${NC} - Remove all containers, networks, and volumes"
    Write-Host "  ${GREEN}View-Logs${NC} - View logs for a specific service"
    Write-Host "  ${GREEN}Rebuild-Service${NC} - Rebuild a specific service"
    Write-Host "  ${GREEN}Check-Volumes${NC} - Check volume paths on the host system"
    Write-Host ""
}

function Start-Development {
    Write-Host "${CYAN}Starting services in development mode...${NC}"
    docker-compose up -d
}

function Start-Production {
    Write-Host "${CYAN}Starting services in production mode...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
}

function Stop-Docker {
    Write-Host "${CYAN}Stopping all running containers...${NC}"
    docker-compose down
}

function Clean-Docker {
    Write-Host "${RED}WARNING: This will remove all Docker containers, networks, and volumes!${NC}"
    Write-Host "${YELLOW}Are you sure you want to continue? (y/n)${NC}"
    $confirm = Read-Host
    
    if ($confirm -eq 'y') {
        Write-Host "${CYAN}Removing all Docker containers, networks, and volumes...${NC}"
        docker-compose down -v
        docker system prune -f
    } else {
        Write-Host "${CYAN}Operation cancelled.${NC}"
    }
}

function View-Logs {
    param([string]$service = "")
    
    if (-not $service) {
        Write-Host "${CYAN}Which service do you want to view logs for?${NC}"
        Write-Host "  1. frontend"
        Write-Host "  2. auth-service"
        Write-Host "  3. tier-list-service"
        Write-Host "  4. chat-service"
        Write-Host "  5. image-storage-service"
        $choice = Read-Host
        
        switch ($choice) {
            1 { $service = "frontend" }
            2 { $service = "auth-service" }
            3 { $service = "tier-list-service" }
            4 { $service = "chat-service" }
            5 { $service = "image-storage-service" }
            default { 
                Write-Host "${RED}Invalid choice. Exiting.${NC}"
                return
            }
        }
    }
    
    Write-Host "${CYAN}Viewing logs for $service...${NC}"
    docker-compose logs -f $service
}

function Rebuild-Service {
    param([string]$service = "")
    
    if (-not $service) {
        Write-Host "${CYAN}Which service do you want to rebuild?${NC}"
        Write-Host "  1. frontend"
        Write-Host "  2. auth-service"
        Write-Host "  3. tier-list-service"
        Write-Host "  4. chat-service"
        Write-Host "  5. image-storage-service"
        $choice = Read-Host
        
        switch ($choice) {
            1 { $service = "frontend" }
            2 { $service = "auth-service" }
            3 { $service = "tier-list-service" }
            4 { $service = "chat-service" }
            5 { $service = "image-storage-service" }
            default { 
                Write-Host "${RED}Invalid choice. Exiting.${NC}"
                return
            }
        }
    }
    
    Write-Host "${CYAN}Rebuilding $service...${NC}"
    docker-compose build $service
    docker-compose up -d $service
}

function Check-Volumes {
    Write-Host "${CYAN}Checking Docker volume paths...${NC}"
    docker volume ls
    
    # Check the bind mounts in docker-compose.yml
    Write-Host "${CYAN}Checking bind mounts in docker-compose files...${NC}"
    Write-Host "${YELLOW}Development:${NC}"
    Get-Content compose.yaml | Select-String "source:" | ForEach-Object { Write-Host "  $_" }
    
    Write-Host "${YELLOW}Production:${NC}"
    Get-Content docker-compose.prod.yml | Select-String "source:" | ForEach-Object { Write-Host "  $_" }
}

# Display available commands when script is loaded
Show-DockerCommands 