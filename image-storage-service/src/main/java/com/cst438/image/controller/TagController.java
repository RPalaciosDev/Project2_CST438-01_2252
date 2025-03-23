package com.cst438.image.controller;

import com.cst438.image.model.TagFrequencyDocument;
import com.cst438.image.service.TagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = "*") // Allow cross-origin requests
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    /**
     * Get all tag frequencies - this is the endpoint that the tier-builder will
     * call
     * to get a pre-computed map of tags and their frequencies
     * 
     * @return Map of tags and their frequencies
     */
    @GetMapping("/frequencies")
    public ResponseEntity<Map<String, Object>> getTagFrequencies() {
        TagFrequencyDocument tagFrequencies = tagService.getTagFrequencies();

        Map<String, Object> response = new HashMap<>();
        response.put("frequencies", tagFrequencies.getFrequencies());
        response.put("lastUpdated", tagFrequencies.getLastUpdated());
        response.put("count", tagFrequencies.getFrequencies().size());

        return ResponseEntity.ok(response);
    }

    /**
     * Force a recalculation of tag frequencies
     * 
     * @return Success message
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshTagFrequencies() {
        tagService.updateTagFrequencies();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tag frequencies refreshed successfully");

        return ResponseEntity.ok(response);
    }
}