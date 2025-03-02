package group_3.tierlistservice.mapper;

import group_3.tierlistservice.dto.TierListRequest;
import group_3.tierlistservice.dto.TierListResponse;
import group_3.tierlistservice.model.TierList;
import group_3.tierlistservice.model.TierItem;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Component
public class TierListMapper {

    public TierList toEntity(TierListRequest request, String userId) {
        return TierList.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .tiers(request.getTiers().stream()
                        .map(tierRequest -> TierList.Tier.builder()
                                .name(tierRequest.getName())
                                .color(tierRequest.getColor())
                                .rank(tierRequest.getRank())
                                .items(tierRequest.getItems().stream()
                                        .map(itemRequest -> TierItem.builder()
                                                .name(itemRequest.getName())
                                                .imageUrl(itemRequest.getImageUrl())
                                                .description(itemRequest.getDescription())
                                                .type(itemRequest.getType())
                                                .category(itemRequest.getCategory())
                                                .position(itemRequest.getPosition())
                                                .build())
                                        .collect(Collectors.toList()))
                                .build())
                        .collect(Collectors.toList()))
                .isPublic(request.isPublic())
                .tags(request.getTags())
                .collaborators(request.getCollaborators())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public TierListResponse toResponse(TierList tierList) {
        return TierListResponse.builder()
                .id(tierList.getId())
                .userId(tierList.getUserId())
                .title(tierList.getTitle())
                .description(tierList.getDescription())
                .tiers(tierList.getTiers().stream()
                        .map(tier -> TierListResponse.TierResponse.builder()
                                .name(tier.getName())
                                .color(tier.getColor())
                                .rank(tier.getRank())
                                .items(tier.getItems().stream()
                                        .map(item -> TierListResponse.TierItemResponse.builder()
                                                .name(item.getName())
                                                .imageUrl(item.getImageUrl())
                                                .description(item.getDescription())
                                                .type(item.getType())
                                                .category(item.getCategory())
                                                .position(item.getPosition())
                                                .build())
                                        .collect(Collectors.toList()))
                                .build())
                        .collect(Collectors.toList()))
                .isPublic(tierList.isPublic())
                .tags(tierList.getTags())
                .collaborators(tierList.getCollaborators())
                .likes(tierList.getLikes())
                .viewCount(tierList.getViewCount())
                .createdAt(tierList.getCreatedAt())
                .updatedAt(tierList.getUpdatedAt())
                .build();
    }
}