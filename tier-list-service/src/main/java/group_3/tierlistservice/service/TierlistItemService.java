package group_3.tierlistservice.service;

import group_3.tierlistservice.dto.TierlistItemRequest;
import group_3.tierlistservice.dto.TierlistItemResponse;
import group_3.tierlistservice.model.TierlistItem;
import group_3.tierlistservice.repository.TierlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierlistItemService {

    private final TierlistItemRepository itemRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchanges.tierlist}")
    private String tierlistExchange;

    @Value("${rabbitmq.routingKeys.create-item}")
    private String createItemKey;

    @Value("${rabbitmq.routingKeys.update-item}")
    private String updateItemKey;

    public TierlistItemResponse createItem(TierlistItemRequest request, String userId) {
        TierlistItem item = TierlistItem.builder()
                .name(request.getName())
                .imageUrl(request.getImageUrl())
                .tags(request.getTags())
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TierlistItem savedItem = itemRepository.save(item);

        // Send message for item creation
        rabbitTemplate.convertAndSend(tierlistExchange, createItemKey, savedItem.getId());
        log.info("Created item with ID: {}", savedItem.getId());

        return buildItemResponse(savedItem);
    }

    public TierlistItemResponse getItemById(String id) {
        TierlistItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        return buildItemResponse(item);
    }

    public List<TierlistItemResponse> getItemsByCreator(String userId) {
        List<TierlistItem> items = itemRepository.findByCreatedBy(userId);
        return items.stream()
                .map(this::buildItemResponse)
                .collect(Collectors.toList());
    }

    public TierlistItemResponse updateItem(String id, TierlistItemRequest request, String userId) {
        TierlistItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        // Validate ownership
        if (!item.getCreatedBy().equals(userId)) {
            throw new RuntimeException("User not authorized to update this item");
        }

        // Update item fields
        item.setName(request.getName());
        item.setImageUrl(request.getImageUrl());
        item.setTags(request.getTags());
        item.setUpdatedAt(LocalDateTime.now());

        TierlistItem updatedItem = itemRepository.save(item);

        // Send message for item update
        rabbitTemplate.convertAndSend(tierlistExchange, updateItemKey, updatedItem.getId());
        log.info("Updated item with ID: {}", updatedItem.getId());

        return buildItemResponse(updatedItem);
    }

    public void deleteItem(String id, String userId) {
        TierlistItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));

        // Validate ownership
        if (!item.getCreatedBy().equals(userId)) {
            throw new RuntimeException("User not authorized to delete this item");
        }

        itemRepository.delete(item);
        log.info("Deleted item with ID: {}", id);
    }

    public List<TierlistItemResponse> searchItemsByName(String name) {
        List<TierlistItem> items = itemRepository.findByNameContainingIgnoreCase(name);
        return items.stream()
                .map(this::buildItemResponse)
                .collect(Collectors.toList());
    }

    public List<TierlistItemResponse> searchItemsByTag(String tag) {
        List<TierlistItem> items = itemRepository.findByTagsContaining(tag);
        return items.stream()
                .map(this::buildItemResponse)
                .collect(Collectors.toList());
    }

    public List<TierlistItemResponse> getItemsByIds(List<String> ids) {
        List<TierlistItem> items = itemRepository.findByIdIn(ids);
        return items.stream()
                .map(this::buildItemResponse)
                .collect(Collectors.toList());
    }

    // Helper method to build item response
    private TierlistItemResponse buildItemResponse(TierlistItem item) {
        return TierlistItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .imageUrl(item.getImageUrl())
                .tags(item.getTags())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}