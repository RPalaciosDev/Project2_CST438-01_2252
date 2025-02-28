db.createUser({
    user: "admin",
    pwd: "your_mongodb_password",
    roles: [
        {
            role: "readWrite",
            db: "auth_db"
        }
    ]
}); 