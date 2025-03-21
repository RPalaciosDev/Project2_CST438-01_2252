package group_3.tierlistservice.controller;

import group_3.tierlistservice.dto.TierlistTemplateRequest;
import group_3.tierlistservice.dto.TierlistTemplateResponse;
import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse;
import group_3.tierlistservice.model.TierlistTemplate;
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
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;

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
        log.info("Received createTemplate request with userId: {}", userId);
        log.info("Request details - title: {}, description: {}", request.getTitle(), request.getDescription());
        log.info("Request details - tags: {}", request.getTags() == null ? "null" : request.getTags().toString());
        log.info("Request details - imageIds: {}",
                request.getImageIds() == null ? "null" : request.getImageIds().size());
        log.info("Request details - thumbnailUrl: {}", request.getThumbnailUrl());

        TierlistTemplateResponse response = templateService.createTemplate(request, userId);
        log.info("Created template with ID: {}", response.getId());
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

    /**
     * Get all templates from the database
     * This is a public endpoint and does not require authentication
     */
    @GetMapping("/all")
    public ResponseEntity<List<TierlistTemplateResponse>> getAllTemplates() {
        log.info("Request received to fetch all templates");
        try {
            List<TierlistTemplateResponse> responses = templateService.getAllTemplates();
            log.info("Successfully retrieved {} templates", responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error retrieving all templates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/test-image-service")
    public ResponseEntity<Map<String, Object>> testImageServiceConnection(
            @RequestParam(required = false) String imageId) {
        Map<String, Object> result = new HashMap<>();

        String testUrl = "https://imageapi-production-af11.up.railway.app/api/images";
        if (imageId != null && !imageId.isEmpty()) {
            testUrl = "https://imageapi-production-af11.up.railway.app/api/images/debug/" + imageId;
        }

        log.info("Testing direct connection to image service at URL: {}", testUrl);

        try {
            URL url = new URL(testUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int status = connection.getResponseCode();
            log.info("Image service connection test status code: {}", status);

            result.put("statusCode", status);

            try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                StringBuilder content = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                result.put("content", content.toString());
                log.info("Image service connection test response: {}", content.toString());
            }

            result.put("success", true);
            result.put("message", "Successfully connected to image service");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error testing image service connection: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}