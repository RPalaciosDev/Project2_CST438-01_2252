package group_3.tierlistservice.service;

import group_3.tierlistservice.model.TierList;
import group_3.tierlistservice.repository.TierListRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierListService {

    private final TierListRepository tierListRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchanges.tier-list}")
    private String tierListExchange;

    @Value("${rabbitmq.routingKeys.create-tier-list}")
    private String createTierListKey;

    @Value("${rabbitmq.routingKeys.update-tier-list}")
    private String updateTierListKey;

    public TierList createTierList(TierList tierList) {
        tierList.setCreatedAt(LocalDateTime.now());
        tierList.setUpdatedAt(LocalDateTime.now());
        tierList.setViewCount(0);

        TierList savedTierList = tierListRepository.save(tierList);

        // Notify about new tier list creation
        rabbitTemplate.convertAndSend(tierListExchange, createTierListKey, savedTierList);

        return savedTierList;
    }

    public Optional<TierList> updateTierList(String id, TierList tierList) {
        return tierListRepository.findById(id)
                .map(existingTierList -> {
                    tierList.setId(id);
                    tierList.setCreatedAt(existingTierList.getCreatedAt());
                    tierList.setUpdatedAt(LocalDateTime.now());
                    tierList.setViewCount(existingTierList.getViewCount());

                    TierList updatedTierList = tierListRepository.save(tierList);

                    // Notify about tier list update
                    rabbitTemplate.convertAndSend(tierListExchange, updateTierListKey, updatedTierList);

                    return updatedTierList;
                });
    }

    public Optional<TierList> getTierList(String id) {
        return tierListRepository.findById(id)
                .map(tierList -> {
                    tierList.setViewCount(tierList.getViewCount() + 1);
                    return tierListRepository.save(tierList);
                });
    }

    public List<TierList> getUserTierLists(String userId) {
        return tierListRepository.findByUserId(userId);
    }

    public List<TierList> getPublicTierLists() {
        return tierListRepository.findByIsPublicTrue();
    }

    public List<TierList> searchTierLists(String query) {
        return tierListRepository.findByTitleContainingIgnoreCase(query);
    }

    public List<TierList> getTierListsByTag(String tag) {
        return tierListRepository.findByTagsContaining(tag);
    }

    public void deleteTierList(String id) {
        tierListRepository.deleteById(id);
    }

    public List<TierList> getCollaborativeTierLists(String userId) {
        return tierListRepository.findByCollaboratorsContaining(userId);
    }
}