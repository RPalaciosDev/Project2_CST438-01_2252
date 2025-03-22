package group_3.tierlistservice.service;

import group_3.tierlistservice.model.TierlistCompletion;
import group_3.tierlistservice.model.TierlistTemplate;
import group_3.tierlistservice.repository.TierlistCompletionRepository;
import group_3.tierlistservice.repository.TierlistTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyTierlistService {

    private final TierlistTemplateRepository templateRepository;
    private final TierlistCompletionRepository completionRepository;

    /**
     * Get the current daily tierlist
     * 
     * @param userId The ID of the user requesting the daily tierlist
     * @return Map containing the daily tierlist info and completion status
     */
    public Map<String, Object> getDailyTierlist(String userId) {
        Map<String, Object> response = new HashMap<>();

        // Get today's date
        LocalDate today = LocalDate.now();

        // Try to find a template set as daily for today
        Optional<TierlistTemplate> todayTemplate = templateRepository.findByWasDailyList(today);

        // If no template is set for today
        if (todayTemplate.isEmpty()) {
            response.put("available", false);
            response.put("message", "No daily tierlist available for today");
            return response;
        }

        TierlistTemplate dailyTemplate = todayTemplate.get();

        // Check if user has already completed this template
        boolean completed = completionRepository.existsByUserIdAndTemplateId(userId, dailyTemplate.getId());

        response.put("available", true);
        response.put("completed", completed);
        response.put("templateId", dailyTemplate.getId());
        response.put("title", dailyTemplate.getTitle());
        response.put("description", dailyTemplate.getDescription());

        return response;
    }

    /**
     * Set a template as the daily tierlist for today
     * 
     * @param templateId  The ID of the template to set as daily
     * @param adminUserId The ID of the admin user making the change
     * @return The updated template
     */
    public TierlistTemplate setDailyTierlist(String templateId, String adminUserId) {
        // TODO: Add admin role check here

        // Get today's date
        LocalDate today = LocalDate.now();

        // Check if there's already a template set for today
        Optional<TierlistTemplate> existingDaily = templateRepository.findByWasDailyList(today);

        // If there's an existing daily template, unset it
        if (existingDaily.isPresent()) {
            TierlistTemplate oldDaily = existingDaily.get();
            // Only unset if it's a different template
            if (!oldDaily.getId().equals(templateId)) {
                log.info("Unsetting previous daily template: {}", oldDaily.getId());

                // Archive the old daily template if needed
                // For now, we just unset the daily status

                oldDaily.setWasDailyList(null);
                templateRepository.save(oldDaily);
            } else {
                // The requested template is already set as daily
                log.info("Template {} is already set as today's daily tierlist", templateId);
                return oldDaily;
            }
        }

        // Find and update the new daily template
        TierlistTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        template.setWasDailyList(today);
        template = templateRepository.save(template);

        log.info("Set template {} as daily tierlist for {}", templateId, today);

        return template;
    }

    /**
     * Mark a daily tierlist as completed by a user
     * 
     * @param userId The ID of the user completing the list
     * @return Success status and message
     */
    public Map<String, Object> markDailyTierlistCompleted(String userId) {
        Map<String, Object> response = new HashMap<>();

        // Get today's date
        LocalDate today = LocalDate.now();

        // Try to find a template set as daily for today
        Optional<TierlistTemplate> todayTemplate = templateRepository.findByWasDailyList(today);

        // If no template is set for today
        if (todayTemplate.isEmpty()) {
            response.put("success", false);
            response.put("message", "No daily tierlist available to complete");
            return response;
        }

        TierlistTemplate dailyTemplate = todayTemplate.get();
        String templateId = dailyTemplate.getId();

        // Check if user has already completed this template
        if (completionRepository.existsByUserIdAndTemplateId(userId, templateId)) {
            response.put("success", false);
            response.put("message", "You have already completed today's tierlist");
            return response;
        }

        // Create completion record
        TierlistCompletion completion = TierlistCompletion.builder()
                .userId(userId)
                .templateId(templateId)
                .completedAt(LocalDateTime.now())
                .build();

        completionRepository.save(completion);

        log.info("User {} completed daily tierlist {} for {}", userId, templateId, today);

        response.put("success", true);
        response.put("message", "Daily tierlist completed successfully");
        return response;
    }
}