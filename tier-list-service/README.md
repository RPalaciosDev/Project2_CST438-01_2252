# Tier List Service

## Overview
The Tier List Service manages tierlist templates and tierlist items for the application. It provides APIs for creating, retrieving, updating, and deleting both templates and items.

## Key Concepts

### Tierlist Templates
Templates contain metadata for tierlists but do not directly embed tierlist items. Instead, they reference items by ID.

**Template properties:**
- ID: Unique identifier
- Title: Name of the tierlist
- Description: Additional information about the tierlist
- View Count: Number of times the template has been accessed
- Created At: Timestamp when the template was created
- Updated At: Timestamp when the template was last modified
- Tags: Categories or keywords associated with the template
- Item IDs: References to the items associated with this template

### Tierlist Items
Items are independent entities that can be reused across multiple templates.

**Item properties:**
- ID: Unique identifier
- Name: Display name of the item
- Tags: Categories or keywords associated with the item
- Image URL: Link to the item's image

## System Design

### Data Flow
1. Frontend requests a tierlist template by ID
2. Backend retrieves the template and all associated items
3. Backend returns the complete template with all item data included
4. Frontend constructs the visual tierlist interface
5. User interaction data (arrangements) is sent to a separate vector processing service

### API Endpoints

#### Template Endpoints
- `GET /api/templates` - Get all templates
- `GET /api/templates/{id}` - Get template by ID with all associated items
- `POST /api/templates` - Create new template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template

#### Item Endpoints
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/tag/{tag}` - Get items by tag

## Integration with Other Services
- **Auth Service**: Validates user permissions for creating/editing templates and items
- **Image Storage Service**: Handles storage and retrieval of item images
- **Vector Processing Service**: Processes user-created arrangements (future integration)

## Technology Stack
- Spring Boot
- MongoDB
- RabbitMQ for event messaging 