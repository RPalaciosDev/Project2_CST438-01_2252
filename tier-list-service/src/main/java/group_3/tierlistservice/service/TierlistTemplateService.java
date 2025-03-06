package group_3.tierlistservice.service;

import group_3.tierlistservice.dto.TierlistTemplateRequest;
import group_3.tierlistservice.dto.TierlistTemplateResponse;
import group_3.tierlistservice.model.TierlistTemplate;
import group_3.tierlistservice.model.TierlistItem;
import group_3.tierlistservice.repository.TierlistTemplateRepository;
import group_3.tierlistservice.repository.TierlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierlistTemplateService {

    private final TierlistTemplateRepository templateRepository;
    private final TierlistItemRepository itemRepository;
    private final MongoTemplate mongoTemplate;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchanges.tierlist}")
    private String tierlistExchange;

    @Value("${rabbitmq.routingKeys.create-template}")
    private String createTemplateKey;

    @Value("${rabbitmq.routingKeys.update-template}")
    private String updateTemplateKey;

    public TierlistTemplateResponse createTemplate(TierlistTemplateRequest request, String userId) {
        // Create and save the template
        TierlistTemplate template = TierlistTemplate.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .tags(request.getTags())
                .itemIds(request.getItemIds())
                .viewCount(0)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TierlistTemplate savedTemplate = templateRepository.save(template);

        // Fetch associated items if present
        List<TierlistItem> items = Collections.emptyList();
        if (savedTemplate.getItemIds() != null && !savedTemplate.getItemIds().isEmpty()) {
            items = itemRepository.findByIdIn(savedTemplate.getItemIds());
        }

        // Send message for template creation
        rabbitTemplate.convertAndSend(tierlistExchange, createTemplateKey, savedTemplate.getId());
        log.info("Created template with ID: {}", savedTemplate.getId());

        return buildTemplateResponse(savedTemplate, items);
    }

    public TierlistTemplateResponse getTemplateById(String id) {
        TierlistTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

        // Increment view count
        template.setViewCount(template.getViewCount() + 1);
        templateRepository.save(template);

        // Fetch associated items
        List<TierlistItem> items = Collections.emptyList();
        if (template.getItemIds() != null && !template.getItemIds().isEmpty()) {
            items = itemRepository.findByIdIn(template.getItemIds());
        }

        return buildTemplateResponse(template, items);
    }

    public List<TierlistTemplateResponse> getTemplatesByUserId(String userId) {
        List<TierlistTemplate> templates = templateRepository.findByUserId(userId);

        // Collect all unique item IDs
        List<String> allItemIds = templates.stream()
                .filter(t -> t.getItemIds() != null)
                .flatMap(t -> t.getItemIds().stream())
                .distinct()
                .collect(Collectors.toList());

        // Fetch all items in one query and make map final
        final Map<String, TierlistItem> itemMap = !allItemIds.isEmpty()
                ? itemRepository.findByIdIn(allItemIds).stream()
                        .collect(Collectors.toMap(TierlistItem::getId, Function.identity()))
                : Collections.emptyMap();

        // Build responses with items
        return templates.stream()
                .map(template -> {
                    List<TierlistItem> templateItems = template.getItemIds() != null
                            ? template.getItemIds().stream()
                                    .map(itemMap::get)
                                    .filter(item -> item != null)
                                    .collect(Collectors.toList())
                            : Collections.emptyList();

                    return buildTemplateResponse(template, templateItems);
                })
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
        template.setItemIds(request.getItemIds());
        template.setUpdatedAt(LocalDateTime.now());

        TierlistTemplate updatedTemplate = templateRepository.save(template);

        // Send message for template update
        rabbitTemplate.convertAndSend(tierlistExchange, updateTemplateKey, updatedTemplate.getId());
        log.info("Updated template with ID: {}", updatedTemplate.getId());

        // Fetch associated items
        List<TierlistItem> items = Collections.emptyList();
        if (updatedTemplate.getItemIds() != null && !updatedTemplate.getItemIds().isEmpty()) {
            items = itemRepository.findByIdIn(updatedTemplate.getItemIds());
        }

        return buildTemplateResponse(updatedTemplate, items);
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
        return buildTemplateBulkResponses(templates);
    }

    public List<TierlistTemplateResponse> searchTemplatesByTag(String tag) {
        List<TierlistTemplate> templates = templateRepository.findByTagsContaining(tag);
        return buildTemplateBulkResponses(templates);
    }

    // Helper method to build template response with items
    private TierlistTemplateResponse buildTemplateResponse(TierlistTemplate template, List<TierlistItem> items) {
        List<TierlistTemplateResponse.TierlistItemDto> itemDtos = items.stream()
                .map(item -> TierlistTemplateResponse.TierlistItemDto.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .imageUrl(item.getImageUrl())
                        .tags(item.getTags())
                        .build())
                .collect(Collectors.toList());

        return TierlistTemplateResponse.builder()
                .id(template.getId())
                .title(template.getTitle())
                .description(template.getDescription())
                .viewCount(template.getViewCount())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .tags(template.getTags())
                .items(itemDtos)
                .build();
    }

    // Helper method to build multiple template responses
    private List<TierlistTemplateResponse> buildTemplateBulkResponses(List<TierlistTemplate> templates) {
        // Collect all unique item IDs
        List<String> allItemIds = templates.stream()
                .filter(t -> t.getItemIds() != null)
                .flatMap(t -> t.getItemIds().stream())
                .distinct()
                .collect(Collectors.toList());

        // Fetch all items in one query and make map final
        final Map<String, TierlistItem> itemMap = !allItemIds.isEmpty()
                ? itemRepository.findByIdIn(allItemIds).stream()
                        .collect(Collectors.toMap(TierlistItem::getId, Function.identity()))
                : Collections.emptyMap();

        // Build responses with items
        return templates.stream()
                .map(template -> {
                    List<TierlistItem> templateItems = template.getItemIds() != null
                            ? template.getItemIds().stream()
                                    .map(itemMap::get)
                                    .filter(item -> item != null)
                                    .collect(Collectors.toList())
                            : Collections.emptyList();

                    return buildTemplateResponse(template, templateItems);
                })
                .collect(Collectors.toList());
    }
}