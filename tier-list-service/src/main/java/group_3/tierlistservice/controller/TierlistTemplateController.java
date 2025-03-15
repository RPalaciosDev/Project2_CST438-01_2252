package group_3.tierlistservice.controller;

import group_3.tierlistservice.dto.TierlistTemplateRequest;
import group_3.tierlistservice.dto.TierlistTemplateResponse;
import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse;
import group_3.tierlistservice.service.TierlistTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@CrossOrigin
public class TierlistTemplateController {

    private final TierlistTemplateService templateService;

    @PostMapping
    public ResponseEntity<TierlistTemplateResponse> createTemplate(
            @Valid @RequestBody TierlistTemplateRequest request,
            @RequestHeader("X-User-ID") String userId) {
        TierlistTemplateResponse response = templateService.createTemplate(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TierlistTemplateResponse> getTemplateById(@PathVariable String id) {
        TierlistTemplateResponse response = templateService.getTemplateById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/with-images")
    public ResponseEntity<TierlistTemplateWithImagesResponse> getTemplateWithImagesById(@PathVariable String id) {
        TierlistTemplateWithImagesResponse response = templateService.getTemplateWithImagesById(id);
        return ResponseEntity.ok(response);
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