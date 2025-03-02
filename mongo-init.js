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

// Create the auth_db database and its collections
db = db.getSiblingDB('auth_db');
db.createCollection('users');
db.createCollection('roles'); 