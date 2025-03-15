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
                TierlistTemplate template = templateRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

                // Increment view count
                template.setViewCount(template.getViewCount() + 1);
                templateRepository.save(template);

                return buildTemplateResponse(template);
        }

        /**
         * Fetches template by ID and augments it with image data from the image service
         * 
         * @param id Template ID to fetch
         * @return Template with all image data included
         */
        public TierlistTemplateWithImagesResponse getTemplateWithImagesById(String id) {
                // Get the template
                TierlistTemplate template = templateRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

                // Increment view count
                template.setViewCount(template.getViewCount() + 1);
                templateRepository.save(template);

                // Fetch images from the image service
                List<TierlistTemplateWithImagesResponse.ImageMetadata> images = imageServiceClient
                                .getImagesByIds(template.getImageIds());

                // Build and return the combined response
                return buildTemplateWithImagesResponse(template, images);
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