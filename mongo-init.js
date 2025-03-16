// Initialize `auth_db` database
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

// Initialize `tier_list_db` database
db = db.getSiblingDB('tier_list_db');

// Create collections for tierlist data
db.createCollection('tierlist_templates');
db.createCollection('tierlist_items');

// Create indexes for optimized queries
db.tierlist_templates.createIndex({ "userId": 1 });
db.tierlist_templates.createIndex({ "title": "text" });
db.tierlist_templates.createIndex({ "tags": 1 });
db.tierlist_items.createIndex({ "templateId": 1 });
