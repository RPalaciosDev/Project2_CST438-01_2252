package group_3.tierlistservice.controller;

import group_3.tierlistservice.model.TierlistCompletion;
import group_3.tierlistservice.repository.TierlistCompletionRepository;
import group_3.tierlistservice.repository.TierlistTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/completions")
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class TierlistCompletionController {

    private final TierlistCompletionRepository completionRepository;
    private final TierlistTemplateRepository templateRepository;

    /**
     * Get all completions for a user
     */
    @GetMapping("/user")
    public ResponseEntity<?> getUserCompletions(@RequestHeader("X-User-ID") String userId) {
        log.info("Getting completions for user: {}", userId);

        try {
            // Find all completions for the user
            List<TierlistCompletion> completions = completionRepository.findByUserId(userId);

            log.info("Found {} completions for user {}", completions.size(), userId);

            // Get all template IDs from completions
            List<String> templateIds = completions.stream()
                    .map(TierlistCompletion::getTemplateId)
                    .collect(Collectors.toList());

            // Create a result list with template details
            List<Map<String, Object>> result = new ArrayList<>();

            for (TierlistCompletion completion : completions) {
                Map<String, Object> completionData = new HashMap<>();
                completionData.put("id", completion.getId());
                completionData.put("userId", completion.getUserId());
                completionData.put("templateId", completion.getTemplateId());
                completionData.put("completedAt", completion.getCompletedAt());

                // Try to get template details
                templateRepository.findById(completion.getTemplateId())
                        .ifPresent(template -> {
                            completionData.put("templateTitle", template.getTitle());
                            completionData.put("templateDescription", template.getDescription());
                            completionData.put("templateThumbnailUrl", template.getThumbnailUrl());
                        });

                result.add(completionData);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting user completions", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve user completions");
            errorResponse.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}