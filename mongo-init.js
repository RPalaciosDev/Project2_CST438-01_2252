// Create admin user
db.createUser({
    user: "admin",
    pwd: "your_secure_password",  // This should match MONGO_ROOT_PASSWORD in .env
    roles: [
        {
            role: "readWrite",
            db: "auth_db"
        },
        {
            role: "dbAdmin",
            db: "auth_db"
        }
    ]
});

// Initialize `auth_db` database and its collections
db = db.getSiblingDB('auth_db');
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
