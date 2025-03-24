# Tier List Service

A Spring Boot microservice for managing tier list templates, items, and daily challenges in the LoveTiers application.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [API Endpoints](#api-endpoints)
- [Daily Tier List System](#daily-tier-list-system)
- [Tag System](#tag-system)
- [Integration with Other Services](#integration-with-other-services)
- [Setup and Installation](#setup-and-installation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

- **Tier List Template Management**
  - Create, retrieve, update, and delete tier list templates
  - Template metadata including title, description, and tags
  - View count tracking for popularity metrics
  - User ownership and access control

- **Tier List Item Management**
  - Reusable items that can be associated with multiple templates
  - Item metadata including name, tags, and image URL
  - Efficient retrieval of items by template

- **Daily Tier List System**
  - Daily challenges for user engagement
  - Completion tracking by user
  - Admin controls for setting the daily tier list
  - User completion status checking
  - Historical record of past daily challenges

- **Tag System**
  - Categorization of templates and items with tags
  - Tag-based search functionality
  - Integration with user preference tracking
  - Automatic sharing of tag data with auth-user-service
  - Support for personalized recommendations

- **Cross-Service Integration**
  - Image integration with image-storage-service
  - Authentication with auth-user-service
  - Tag data sharing for user preferences
  - Match data integration with ml-service

## Tech Stack

- **Core**: Spring Boot 3.4.3, Java 21
- **Database**: MongoDB
- **API**: RESTful API with Spring Web
- **Validation**: Spring Validation
- **Reactive**: Spring WebFlux for service-to-service communication
- **Documentation**: Spring REST Docs
- **Deployment**: Docker, Railway

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │   Auth User     │     │      ML         │
│   Application   │     │     Service     │     │    Service      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────┬───────────┴───────────┬───────────┘
                     │                       │
           ┌─────────▼─────────┐   ┌─────────▼─────────┐
           │   Tier List       │◄──┤  Image Storage    │
           │     Service       │   │     Service       │
           └─────────┬─────────┘   └───────────────────┘
                     │
                     ▼
           ┌───────────────────┐
           │     MongoDB       │
           │     Database      │
           └───────────────────┘
```

## Core Components

### Models

1. **TierlistTemplate**
   - Core entity for tier list metadata
   - Properties: id, title, description, viewCount, createdAt, updatedAt, tags, itemIds, userId, wasDailyList
   - Tracks ownership and associations with items
   - Records when a template was used as the daily tier list

2. **TierlistItem**
   - Reusable entity for tier list items
   - Properties: id, name, tags, imageUrl, createdAt, updatedAt, createdBy
   - Can be associated with multiple templates

3. **TierlistCompletion**
   - Records user completion of daily tier lists
   - Properties: id, userId, templateId, completedAt
   - Used for tracking user engagement

### Services

1. **TierlistTemplateService**
   - Core business logic for template operations
   - Handles template creation, retrieval, updating, and deletion
   - Manages relationships between templates and items
   - Integrates with image service to fetch item images

2. **DailyTierlistService**
   - Manages the daily tier list feature
   - Sets and retrieves the current daily tier list
   - Tracks user completion status
   - Provides completion statistics
   - Handles date-based business logic

3. **ImageServiceClient**
   - Integration with the image-storage-service
   - Fetches image metadata for tier list items
   - Handles communication with external service

### Repositories

1. **TierlistTemplateRepository**
   - MongoDB data access for templates
   - Custom queries for template retrieval
   - Supports finding by tags and userId
   - Includes `findByWasDailyList(LocalDate date)` for daily tier list

2. **TierlistCompletionRepository**
   - MongoDB data access for completion records
   - Tracks which users have completed which tier lists
   - Supports querying by user and template
   - Method `existsByUserIdAndTemplateId` for completion status checking

## API Endpoints

### Template Endpoints

#### Create Template

- **Endpoint**: `POST /api/templates`
- **Auth Required**: Yes (`X-User-ID` header)
- **Request Body**:

  ```json
  {
    "title": "One Piece Characters",
    "description": "Rank the Straw Hat crew",
    "tags": ["anime", "one-piece"],
    "imageIds": ["id1", "id2", "id3"],
    "thumbnailUrl": "https://example.com/thumbnail.jpg"
  }
  ```

- **Response**: Created template with ID

#### Get Template by ID

- **Endpoint**: `GET /api/templates/{id}`
- **Auth Required**: No
- **Response**: Template metadata without images

#### Get Template with Images

- **Endpoint**: `GET /api/templates/{id}/with-images`
- **Auth Required**: No
- **Response**: Complete template with all image data

#### Get User's Templates

- **Endpoint**: `GET /api/templates/user`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**: List of templates created by the user

#### Update Template

- **Endpoint**: `PUT /api/templates/{id}`
- **Auth Required**: Yes (`X-User-ID` header)
- **Request Body**: Same as create template
- **Response**: Updated template

#### Delete Template

- **Endpoint**: `DELETE /api/templates/{id}`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**: 204 No Content

#### Search Templates

- **Endpoint**: `GET /api/templates/search?title=keyword&tag=keyword`
- **Auth Required**: No
- **Response**: List of matching templates

### Daily Tier List Endpoints

#### Get Daily Tier List

- **Endpoint**: `GET /api/daily`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**:

  ```json
  {
    "available": true,
    "completed": false,
    "templateId": "template123",
    "title": "Daily One Piece Ranking",
    "description": "Rank the Straw Hat crew for today's challenge"
  }
  ```

#### Set Daily Tier List

- **Endpoint**: `POST /api/daily/{templateId}`
- **Auth Required**: Yes (`X-User-ID` header with admin privileges)
- **Response**: Confirmation of daily tier list being set

#### Mark Daily Tier List Completed

- **Endpoint**: `POST /api/daily/complete`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**: Confirmation of completion status

### Tier List Completion Endpoints

#### Get Completion Status

- **Endpoint**: `GET /api/completions/status/{templateId}`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**: Boolean indicating whether the user has completed the template

#### Get User Completion Statistics

- **Endpoint**: `GET /api/completions/stats/user`
- **Auth Required**: Yes (`X-User-ID` header)
- **Response**: Statistics about the user's completion history

## Daily Tier List System

The Daily Tier List feature encourages user engagement by presenting a new challenge each day:

### Setting the Daily Challenge

- Administrators can designate any template as the "daily tier list"
- Only one template can be active per day
- Previous daily templates are tracked in history

### User Interaction Flow

1. User checks for today's challenge via `/api/daily` endpoint
2. Frontend displays the daily challenge with completion status
3. User completes the tier list and submits their arrangement
4. Backend marks the challenge as completed for that user

### Implementation Details

The daily tier list system is implemented with the following key components:

- `TierlistTemplate` model includes a `wasDailyList` field storing the date when it was the daily tier list
- `DailyTierlistService` manages the core business logic:

```java
public Map<String, Object> getDailyTierlist(String userId) {
    // Get today's date
    LocalDate today = LocalDate.now();

    // Try to find a template set as daily for today
    Optional<TierlistTemplate> todayTemplate = templateRepository.findByWasDailyList(today);

    // Check if user has already completed this template
    boolean completed = completionRepository.existsByUserIdAndTemplateId(userId, dailyTemplate.getId());

    // Return response with template data and completion status
}
```

### Completion Tracking

```java
public Map<String, Object> markDailyTierlistCompleted(String userId) {
    // Get today's template
    LocalDate today = LocalDate.now();
    Optional<TierlistTemplate> todayTemplate = templateRepository.findByWasDailyList(today);
    
    // Create completion record
    TierlistCompletion completion = TierlistCompletion.builder()
            .userId(userId)
            .templateId(templateId)
            .completedAt(LocalDateTime.now())
            .build();
    
    completionRepository.save(completion);
    // Return success response
}
```

### Benefits

- Increases daily active users
- Creates a shared experience for the community
- Provides consistent data for the ML matching algorithm
- Encourages users to explore different tier list types

## Tag System

The Tag System is a crucial feature that enhances discoverability and enables personalization:

### Tag Implementation

- Tags are stored as string arrays in both `TierlistTemplate` and `TierlistItem` models
- Tags can be assigned during creation and modified during updates
- Multiple tags can be assigned to each template or item

### Tag-Based Search

- The service provides endpoints for searching templates by tag
- Search results can be filtered by multiple tags
- Tags are case-insensitive for better user experience

### Integration with User Preferences

A key feature of the tag system is its integration with the auth-user-service for personalization:

1. When a user creates a template with tags, those tags are recorded as user preferences
2. When a user completes a tier list, its tags are recorded as interests
3. This data is stored in the auth-user-service for personalization and matching

### Implementation Example

```java
private void recordUserTagPreferences(String userId, List<String> tags) {
    try {
        webClient.post()
            .uri(authServiceUrl + "/api/user/tags/record/" + userId)
            .bodyValue(Map.of("tags", tags))
            .retrieve()
            .toBodilessEntity()
            .subscribe(
                response -> log.info("Successfully recorded tags for user: {}", userId),
                error -> log.error("Error recording tags for user {}: {}", userId, error.getMessage())
            );
    } catch (Exception e) {
        log.error("Failed to record tags for user {}: {}", userId, e.getMessage());
    }
}
```

### Tag System Benefits

- **Personalization**: Enables recommendations based on user interests
- **Discoverability**: Helps users find relevant content
- **Matching**: Provides data points for ML matching algorithms
- **Analytics**: Allows tracking of popular categories and trends

## Integration with Other Services

### Auth User Service

- Validates user authentication via header verification
- Records user tag preferences when tier lists are created or completed
- Example tag recording integration:

  ```java
  @PostMapping
  public ResponseEntity<TierlistTemplateResponse> createTemplate(
          @Valid @RequestBody TierlistTemplateRequest request,
          @RequestHeader("X-User-ID") String userId) {
      // Create template
      TierlistTemplateResponse response = templateService.createTemplate(request, userId);
      
      // Record tags for user preferences (if tags exist)
      if (request.getTags() != null && !request.getTags().isEmpty()) {
          recordUserTagPreferences(userId, request.getTags());
      }
      
      return new ResponseEntity<>(response, HttpStatus.CREATED);
  }
  ```

### Image Storage Service

- Fetches image metadata for tier list items
- Uses WebClient for reactive service-to-service communication
- Example image retrieval integration:

  ```java
  public List<ImageMetadata> fetchImagesByIds(List<String> imageIds) {
      return webClient.post()
              .uri("/api/images/fetchByIds")
              .bodyValue(Map.of("ids", imageIds))
              .retrieve()
              .bodyToMono(new ParameterizedTypeReference<List<ImageMetadata>>() {})
              .block();
  }
  ```

### ML Service

- Provides template data for match processing
- Sends completion data for user matching
- Enables sophisticated user pairing based on tier list preferences

## Setup and Installation

### Prerequisites

- Java 21 or higher
- MongoDB 5.0+
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tier-list-service
   ```

2. **Configure MongoDB**

   Either use a local MongoDB instance or Docker:

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:5
   ```

3. **Configure environment variables**

   Create `application-dev.properties` or use environment variables:

   ```properties
   # MongoDB Configuration
   spring.data.mongodb.uri=mongodb://localhost:27017/tierlist_db
   
   # Service Integration
   services.image-storage-service.url=http://localhost:8084
   services.auth-user-service.url=http://localhost:8081
   ```

4. **Build and run the application**

   ```bash
   ./gradlew bootRun
   ```

### Using Docker

```bash
# Build the Docker image
docker build -t tier-list-service .

# Run the container
docker run -p 8082:8082 -e SPRING_DATA_MONGODB_URI=mongodb://host.docker.internal:27017/tierlist_db tier-list-service
```

## Deployment

### Railway Deployment

The Tier List Service is configured for deployment on Railway:

1. Push your code to a Git repository
2. Connect the repository to Railway
3. Set the required environment variables
4. Deploy the service

Required environment variables:

```
MONGODB_URI=mongodb://username:password@host:port/tierlist_db
IMAGE_SERVICE_URL=https://your-image-service-url
AUTH_SERVICE_URL=https://your-auth-service-url
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Problems

- Verify MongoDB credentials and connection string
- Check network connectivity to MongoDB instance
- Ensure proper authentication is configured

#### Image Service Integration Issues

- Verify image service is running and accessible
- Check logs for WebClient connection errors
- Ensure correct image service URL is configured

#### Template Not Found Errors

- Verify template ID is correct and exists in database
- Check if template was accidentally deleted
- Validate MongoDB indexes are properly set up

#### Daily Tier List Not Showing

- Check if a daily tier list has been set for today's date
- Verify the `wasDailyList` field contains the correct date
- Ensure the template exists and hasn't been deleted

### Logs and Debugging

For detailed logs:

```bash
# Set logging level in application.properties
logging.level.group_3.tierlistservice=DEBUG

# For Docker deployments
docker logs -f tier-list-service

# For Railway deployments
railway logs
```

### Health Check

The service includes a health endpoint:

```bash
curl http://localhost:8082/actuator/health
```

Response:

```json
{
  "status": "UP",
  "components": {
    "mongo": {
      "status": "UP"
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```
