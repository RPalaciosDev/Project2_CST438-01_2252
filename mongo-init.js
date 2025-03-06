// Initialize `auth_db` database
db = db.getSiblingDB('admin');

// Create admin user if it doesn't exist
if (!db.getUser('admin')) {
    db.createUser({
        user: 'admin',
        pwd: process.env.MONGO_ROOT_PASSWORD,
        roles: [{ role: 'root', db: 'admin' }]
    });
}

// Switch to auth_db and create it if it doesn't exist
db = db.getSiblingDB('auth_db');

// Create collections
db.createCollection('users');
db.createCollection('roles');

// Initialize `image_storage_db` database
db = db.getSiblingDB('image_storage_db');

// Create collections if they don't exist
if (!db.getCollectionNames().includes("images")) {
    db.createCollection('images');
}
if (!db.getCollectionNames().includes("thumbnails")) {
    db.createCollection('thumbnails');
}

// Create indexes for optimized queries
db.images.createIndex({ "fileName": 1 });
db.images.createIndex({ "uploadDate": 1 });
db.images.createIndex({ "userId": 1 });
db.thumbnails.createIndex({ "originalImageId": 1 });

// Create indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "provider": 1, "providerId": 1 }, { unique: true, sparse: true });
