package group_3.tierlistservice.controller;

import group_3.tierlistservice.model.TierlistTemplate;
import group_3.tierlistservice.service.DailyTierlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/daily")
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class DailyTierlistController {

    private final DailyTierlistService dailyTierlistService;

    /**
     * Get the current daily tierlist with user completion status
     */
    @GetMapping
    public ResponseEntity<?> getDailyTierlist(@RequestHeader("X-User-ID") String userId) {
        log.info("Received getDailyTierlist request from userId: {}", userId);
        Map<String, Object> response = dailyTierlistService.getDailyTierlist(userId);

        if (!(boolean) response.getOrDefault("available", false)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Set a template as the daily tierlist for today
     * This endpoint would typically require admin privileges
     */
    @PostMapping("/{templateId}")
    public ResponseEntity<?> setDailyTierlist(
            @PathVariable String templateId,
            @RequestHeader("X-User-ID") String userId) {
        log.info("Received setDailyTierlist request for templateId: {} from userId: {}", templateId, userId);

        try {
            TierlistTemplate updatedTemplate = dailyTierlistService.setDailyTierlist(templateId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Template set as daily tierlist successfully");
            response.put("templateId", updatedTemplate.getId());
            response.put("date", updatedTemplate.getWasDailyList());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Mark the daily tierlist as completed by a user
     */
    @PostMapping("/complete")
    public ResponseEntity<?> markDailyTierlistCompleted(@RequestHeader("X-User-ID") String userId) {
        log.info("Received markDailyTierlistCompleted request from userId: {}", userId);

        Map<String, Object> response = dailyTierlistService.markDailyTierlistCompleted(userId);

        if (!(boolean) response.getOrDefault("success", false)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        return ResponseEntity.ok(response);
    }
}