# Tier List Service AI Specification

## System Architecture

```
┌─────────────┐       ┌───────────────┐       ┌─────────────────┐
│             │       │               │       │                 │
│  Frontend   │◄─────►│  Tier List    │◄─────►│  Vector         │
│  Application│       │  Service      │       │  Processing     │
│             │       │               │       │  Service        │
└─────────────┘       └───────────────┘       └─────────────────┘
                             ▲
                             │
                             ▼
                      ┌──────────────┐
                      │              │
                      │  MongoDB     │
                      │  Database    │
                      │              │
                      └──────────────┘
```

## Database Schema

### Collection: tierlist_templates

```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "viewCount": "Number",
  "createdAt": "Date",
  "updatedAt": "Date",
  "tags": ["String"],
  "itemIds": ["ObjectId"],
  "userId": "String"
}
```

### Collection: tierlist_items

```json
{
  "_id": "ObjectId",
  "name": "String",
  "tags": ["String"],
  "imageUrl": "String",
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "String"
}
```

## API Request/Response Formats

### Template Endpoints

#### GET /api/templates/{id}

Response:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "viewCount": 0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "tags": ["string"],
  "items": [
    {
      "id": "string",
      "name": "string",
      "tags": ["string"],
      "imageUrl": "string"
    }
  ]
}
```

#### POST /api/templates

Request:
```json
{
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "itemIds": ["string"]
}
```

### Item Endpoints

#### GET /api/items/{id}

Response:
```json
{
  "id": "string",
  "name": "string",
  "tags": ["string"],
  "imageUrl": "string",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/items

Request:
```json
{
  "name": "string",
  "tags": ["string"],
  "imageUrl": "string"
}
```

## Service Implementation Requirements

### Core Components

1. **Models**
   - TierlistTemplate
   - TierlistItem
   - DTOs for requests and responses

2. **Repositories**
   - TierlistTemplateRepository
   - TierlistItemRepository

3. **Services**
   - TierlistTemplateService
   - TierlistItemService

4. **Controllers**
   - TierlistTemplateController
   - TierlistItemController

### Functionality Requirements

1. When retrieving a template:
   - Fetch all associated items in a single operation
   - Combine them into a complete response
   - Increment the view count

2. When creating/updating a template:
   - Validate that all referenced items exist
   - Set appropriate timestamps

3. When deleting a template:
   - Do not delete associated items
   - Only remove the template record

4. When deleting an item:
   - Check if it's referenced by any templates
   - Either prevent deletion or allow with warning

## Integration Points

1. **Auth Service**
   - JWT token validation for authenticated routes
   - User ID extraction for ownership checks

2. **Image Storage Service**
   - Store image URLs, not actual images
   - Validate image URLs when creating/updating items

3. **Vector Processing Service**
   - Separate service that consumes user-created arrangements
   - Not directly integrated in current implementation 