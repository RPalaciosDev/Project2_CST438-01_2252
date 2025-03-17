package group_3.tierlistservice.controller;

import group_3.tierlistservice.dto.TierlistTemplateRequest;
import group_3.tierlistservice.dto.TierlistTemplateResponse;
import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse;
import group_3.tierlistservice.service.TierlistTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class TierlistTemplateController {

    private final TierlistTemplateService templateService;

    @PostMapping
    public ResponseEntity<TierlistTemplateResponse> createTemplate(
            @Valid @RequestBody TierlistTemplateRequest request,
            @RequestHeader("X-User-ID") String userId) {
        TierlistTemplateResponse response = templateService.createTemplate(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get a template by ID
     * Note: This is a public endpoint and does not require userId verification
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTemplateById(@PathVariable String id) {
        log.info("Public template fetch requested for id: {}", id);
        try {
            TierlistTemplateResponse response = templateService.getTemplateById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error retrieving template for id {}: {}", id, e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve template");
            errorResponse.put("detail", e.getMessage());

            if (e.getMessage().contains("Template not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        } catch (Exception e) {
            log.error("Unexpected error retrieving template for id {}: {}", id, e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Unexpected error processing request");
            errorResponse.put("detail", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get a template with all its images by ID
     * Note: This is a public endpoint and does not require userId verification
     */
    @GetMapping("/{id}/with-images")
    public ResponseEntity<?> getTemplateWithImagesById(@PathVariable String id) {
        try {
            log.info("Public template with images fetch requested for id: {}", id);
            TierlistTemplateWithImagesResponse response = templateService.getTemplateWithImagesById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log the error with stack trace
            log.error("Error retrieving template with images for id {}: {}", id, e.getMessage(), e);
            // Return a more informative error response
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve template with images");
            errorResponse.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user")
    public ResponseEntity<List<TierlistTemplateResponse>> getTemplatesByUser(
            @RequestHeader("X-User-ID") String userId) {
        List<TierlistTemplateResponse> responses = templateService.getTemplatesByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TierlistTemplateResponse> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody TierlistTemplateRequest request,
            @RequestHeader("X-User-ID") String userId) {
        TierlistTemplateResponse response = templateService.updateTemplate(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable String id,
            @RequestHeader("X-User-ID") String userId) {
        templateService.deleteTemplate(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<TierlistTemplateResponse>> searchTemplates(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String tag) {
        List<TierlistTemplateResponse> responses;

        if (title != null && !title.isEmpty()) {
            responses = templateService.searchTemplatesByTitle(title);
        } else if (tag != null && !tag.isEmpty()) {
            responses = templateService.searchTemplatesByTag(tag);
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(responses);
    }
}