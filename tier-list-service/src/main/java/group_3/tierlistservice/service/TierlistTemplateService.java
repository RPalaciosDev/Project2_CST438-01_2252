package group_3.tierlistservice.service;

import group_3.tierlistservice.dto.TierlistTemplateRequest;
import group_3.tierlistservice.dto.TierlistTemplateResponse;
import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse;
import group_3.tierlistservice.model.TierlistTemplate;
import group_3.tierlistservice.repository.TierlistTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierlistTemplateService {

        private final TierlistTemplateRepository templateRepository;
        private final MongoTemplate mongoTemplate;

        @Autowired
        private ImageServiceClient imageServiceClient;

        public TierlistTemplateResponse createTemplate(TierlistTemplateRequest request, String userId) {
                // Create and save the template
                TierlistTemplate template = TierlistTemplate.builder()
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .tags(request.getTags())
                                .imageIds(request.getImageIds())
                                .viewCount(0)
                                .userId(userId)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                TierlistTemplate savedTemplate = templateRepository.save(template);
                log.info("Created template with ID: {}", savedTemplate.getId());

                return buildTemplateResponse(savedTemplate);
        }

        public TierlistTemplateResponse getTemplateById(String id) {
                try {
                        log.info("Trying to fetch template with ID: {}", id);

                        // Try to find the template by ID
                        TierlistTemplate template = null;
                        try {
                                template = templateRepository.findById(id)
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Template not found with id: " + id));
                                log.info("Successfully found template with ID: {} and userId: {}", id,
                                                template.getUserId());
                        } catch (Exception e) {
                                log.error("Failed to find template with ID: {}", id, e);
                                throw e;
                        }

                        // Increment view count
                        try {
                                template.setViewCount(template.getViewCount() + 1);
                                templateRepository.save(template);
                                log.info("Successfully incremented view count for template: {}", id);
                        } catch (Exception e) {
                                log.error("Failed to update view count for template: {}", id, e);
                                // Continue execution even if view count update fails
                        }

                        // Build response
                        try {
                                TierlistTemplateResponse response = buildTemplateResponse(template);
                                log.info("Successfully built response for template: {}", id);
                                return response;
                        } catch (Exception e) {
                                log.error("Failed to build response for template: {}", id, e);
                                throw e;
                        }
                } catch (Exception e) {
                        log.error("Unhandled exception in getTemplateById for ID {}: {}", id, e.getMessage(), e);
                        throw e;
                }
        }

        /**
         * Fetches template by ID and augments it with image data from the image service
         * 
         * @param id Template ID to fetch
         * @return Template with all image data included
         */
        public TierlistTemplateWithImagesResponse getTemplateWithImagesById(String id) {
                try {
                        log.info("Beginning getTemplateWithImagesById for id: {}", id);

                        // Get the template
                        log.info("Attempting to fetch template from database with id: {}", id);
                        TierlistTemplate template = null;
                        try {
                                template = templateRepository.findById(id)
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Template not found with id: " + id));

                                // Added log to show the userId in the template for debugging
                                log.info("Successfully retrieved template from database: {} with userId: {}",
                                                template.getId(), template.getUserId());
                        } catch (Exception e) {
                                log.error("Failed to retrieve template from database: {}", e.getMessage(), e);
                                throw e;
                        }

                        // Increment view count
                        log.info("Incrementing view count for template: {}", template.getId());
                        try {
                                template.setViewCount(template.getViewCount() + 1);
                                templateRepository.save(template);
                                log.info("View count incremented and saved successfully");
                        } catch (Exception e) {
                                log.error("Failed to update view count: {}", e.getMessage(), e);
                                // Continue execution even if view count update fails
                        }

                        // Fetch images from the image service
                        log.info("Preparing to fetch images. Template has {} image IDs", template.getImageIds().size());
                        List<TierlistTemplateWithImagesResponse.ImageMetadata> images = null;
                        try {
                                images = imageServiceClient.getImagesByIds(template.getImageIds());
                                log.info("Successfully retrieved {} images from image service", images.size());
                        } catch (Exception e) {
                                log.error("Error while fetching images from image service: {}", e.getMessage(), e);
                                // Continue with empty images rather than failing completely
                                images = Collections.emptyList();
                        }

                        // Build and return the combined response
                        log.info("Building final response with template and {} images", images.size());
                        try {
                                TierlistTemplateWithImagesResponse response = buildTemplateWithImagesResponse(template,
                                                images);
                                log.info("Successfully built response with template ID: {}", response.getId());
                                return response;
                        } catch (Exception e) {
                                log.error("Error while building template response: {}", e.getMessage(), e);
                                throw e;
                        }
                } catch (Exception e) {
                        log.error("Unhandled exception in getTemplateWithImagesById: {}", e.getMessage(), e);
                        throw e;
                }
        }

        public List<TierlistTemplateResponse> getTemplatesByUserId(String userId) {
                List<TierlistTemplate> templates = templateRepository.findByUserId(userId);

                // Build responses
                return templates.stream()
                                .map(this::buildTemplateResponse)
                                .collect(Collectors.toList());
        }

        public TierlistTemplateResponse updateTemplate(String id, TierlistTemplateRequest request, String userId) {
                TierlistTemplate template = templateRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

                // Validate ownership
                if (!template.getUserId().equals(userId)) {
                        throw new RuntimeException("User not authorized to update this template");
                }

                // Update template fields
                template.setTitle(request.getTitle());
                template.setDescription(request.getDescription());
                template.setTags(request.getTags());
                template.setImageIds(request.getImageIds());
                template.setUpdatedAt(LocalDateTime.now());

                TierlistTemplate updatedTemplate = templateRepository.save(template);
                log.info("Updated template with ID: {}", updatedTemplate.getId());

                return buildTemplateResponse(updatedTemplate);
        }

        public void deleteTemplate(String id, String userId) {
                TierlistTemplate template = templateRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

                // Validate ownership
                if (!template.getUserId().equals(userId)) {
                        throw new RuntimeException("User not authorized to delete this template");
                }

                templateRepository.delete(template);
                log.info("Deleted template with ID: {}", id);
        }

        public List<TierlistTemplateResponse> searchTemplatesByTitle(String title) {
                List<TierlistTemplate> templates = templateRepository.findByTitleContainingIgnoreCase(title);
                return templates.stream().map(this::buildTemplateResponse).collect(Collectors.toList());
        }

        public List<TierlistTemplateResponse> searchTemplatesByTag(String tag) {
                List<TierlistTemplate> templates = templateRepository.findByTagsContaining(tag);
                return templates.stream().map(this::buildTemplateResponse).collect(Collectors.toList());
        }

        // Helper method to build template response
        private TierlistTemplateResponse buildTemplateResponse(TierlistTemplate template) {
                return TierlistTemplateResponse.builder()
                                .id(template.getId())
                                .title(template.getTitle())
                                .description(template.getDescription())
                                .viewCount(template.getViewCount())
                                .createdAt(template.getCreatedAt())
                                .updatedAt(template.getUpdatedAt())
                                .tags(template.getTags())
                                .build();
        }

        // Helper method to build template response with images
        private TierlistTemplateWithImagesResponse buildTemplateWithImagesResponse(
                        TierlistTemplate template,
                        List<TierlistTemplateWithImagesResponse.ImageMetadata> images) {

                return TierlistTemplateWithImagesResponse.builder()
                                .id(template.getId())
                                .userId(template.getUserId())
                                .title(template.getTitle())
                                .description(template.getDescription())
                                .viewCount(template.getViewCount())
                                .createdAt(template.getCreatedAt())
                                .updatedAt(template.getUpdatedAt())
                                .tags(template.getTags())
                                .images(images)
                                .build();
        }
}