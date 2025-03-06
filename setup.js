const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const crypto = require('crypto');

// Platform-independent paths
const PATHS = {
    secrets: path.join(__dirname, 'secrets'),
    nginx: path.join(__dirname, 'nginx', 'ssl'),
    env: path.join(__dirname, '.env'),
    envExample: path.join(__dirname, '.env.example'),
    frontend: path.join(__dirname, 'frontend'),
};

// Console colors
const COLORS = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${COLORS.cyan}${msg}${COLORS.reset}`),
    success: (msg) => console.log(`${COLORS.green}${msg}${COLORS.reset}`),
    warning: (msg) => console.log(`${COLORS.yellow}${msg}${COLORS.reset}`),
    error: (msg) => console.log(`${COLORS.red}${msg}${COLORS.reset}`)
};

// Ensure directories exist
function ensureDirectories() {
    Object.values(PATHS).forEach(dir => {
        if (!fs.existsSync(path.dirname(dir))) {
            fs.mkdirSync(path.dirname(dir), { recursive: true });
            log.success(`Created directory: ${dir}`);
        }
    });
}

// Generate random string
function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

// Copy template files if they don't exist
function copyTemplateIfNotExists(source, dest) {
    if (!fs.existsSync(dest)) {
        fs.copyFileSync(source, dest);
        log.success(`Created ${dest} from template`);
    } else {
        log.warning(`${dest} already exists, skipping...`);
    }
}

// Update environment file
function updateEnvFile(secrets) {
    try {
        let envContent = fs.readFileSync(PATHS.env, 'utf8');
        Object.entries(secrets).forEach(([key, value]) => {
            const regex = new RegExp(`${key.toUpperCase()}=.*`, 'g');
            envContent = envContent.replace(regex, `${key.toUpperCase()}=${value}`);
        });
        fs.writeFileSync(PATHS.env, envContent);
        log.success('Updated .env file with new secrets');
    } catch (error) {
        log.error(`Failed to update .env file: ${error.message}`);
        throw error;
    }
}

// Setup frontend environment
function setupFrontend() {
    if (fs.existsSync(PATHS.frontend)) {
        log.info('Setting up frontend environment...');
        const frontendEnvPath = path.join(PATHS.frontend, '.env');
        
        // Create frontend .env file
        const frontendEnv = [
            'EXPO_PUBLIC_API_URL=http://localhost:8081',
            'EXPO_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:8081/auth/callback',
            `EXPO_PUBLIC_GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here'}`
        ].join('\n');
        
        fs.writeFileSync(frontendEnvPath, frontendEnv);
        log.success('Created frontend .env file');
    } else {
        log.warning('Frontend directory not found, skipping frontend setup');
    }
}

// Setup services
async function setupServices() {
    const services = ['auth-user-service', 'tier-list-service', 'chat_api', 'image-storage-service'];
    
    for (const service of services) {
        const gradlew = path.join(__dirname, service, os.platform() === 'win32' ? 'gradlew.bat' : 'gradlew');
        if (fs.existsSync(gradlew)) {
            try {
                // Make gradlew executable on Unix-like systems
                if (os.platform() !== 'win32') {
                    fs.chmodSync(gradlew, '755');
                }
                execSync(`"${gradlew}" wrapper`, { stdio: 'inherit' });
                log.success(`Setup completed for ${service}`);
            } catch (error) {
                log.error(`Error setting up ${service}: ${error.message}`);
            }
        }
    }
}

// Main setup function
async function setup() {
    try {
        log.info('Starting LoveTiers App setup...');
        
        // Ensure all necessary directories exist
        ensureDirectories();
        
        // Copy template files
        copyTemplateIfNotExists(PATHS.envExample, PATHS.env);
        
        // Generate secrets
        const secrets = {
            mongoPassword: generateRandomString(16),
            jwtSecret: generateRandomString(32),
            dbPassword: generateRandomString(16)
        };
        
        // Update environment files
        updateEnvFile(secrets);
        
        // Setup frontend
        setupFrontend();
        
        // Setup services
        await setupServices();
        
        // Save credentials
        const credentialsPath = path.join(__dirname, 'credentials.txt');
        const credentialsContent = `
LoveTiers App Credentials
Generated on: ${new Date().toISOString()}

MongoDB Root Password: ${secrets.mongoPassword}
JWT Secret: ${secrets.jwtSecret}
Database Password: ${secrets.dbPassword}

⚠️ IMPORTANT:
1. Keep this file secure and never commit it to version control
2. Share these credentials securely with team members
3. For production, use different credentials and a secure password manager
        `.trim();
        
        fs.writeFileSync(credentialsPath, credentialsContent);
        log.success(`Credentials saved to ${credentialsPath}`);
        
        log.success('Setup completed successfully! 🚀');
        log.info('\nNext steps:');
        log.info('1. Review the generated credentials in credentials.txt');
        log.info('2. Start the services with: docker compose up -d');
        
    } catch (error) {
        log.error('Setup failed:');
        log.error(error.message);
        process.exit(1);
    }
}

setup(); 