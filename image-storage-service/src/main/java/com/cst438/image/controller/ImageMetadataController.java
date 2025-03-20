package com.cst438.image.controller;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.service.ImageMetadataService;
import com.cst438.image.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Collections;
import java.util.Optional;

@RestController
@RequestMapping("/api/images")
public class ImageMetadataController {

    private final ImageMetadataService metadataService;
    private final StorageService storageService;

    public ImageMetadataController(ImageMetadataService metadataService, StorageService storageService) {
        this.metadataService = metadataService;
        this.storageService = storageService;
    }

    @PostMapping("/store")
    public ResponseEntity<ImageMetadataDocument> storeImageUrl(
            @RequestParam String fileName,
            @RequestParam String s3Url,
            @RequestParam String uploadedBy,
            @RequestParam(required = false) String folder) {

        ImageMetadataDocument savedMetadata = metadataService.storeImageUrl(fileName, s3Url, uploadedBy, folder);
        return ResponseEntity.ok(savedMetadata);
    }

    @GetMapping
    public ResponseEntity<List<ImageMetadataDocument>> getImagesByFolder(
            @RequestParam(required = false) String folder) {
        List<ImageMetadataDocument> images = (folder != null && !folder.isEmpty())
                ? metadataService.getImagesByFolder(folder)
                : metadataService.getAllImages();
        return ResponseEntity.ok(images);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncImages() {
        storageService.syncS3ToMongo();
        return ResponseEntity.ok("S3 Images Synced to MongoDB");
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ImageMetadataDocument>> getImagesByIds(
            @RequestBody List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        System.out.println("Received request for image IDs: " + ids);

        List<ImageMetadataDocument> images = metadataService.getImagesByIds(ids);

        System.out.println("Found " + images.size() + " images out of " + ids.size() + " requested IDs");

        // If we didn't find all the images, log individual checks
        if (images.size() < ids.size()) {
            for (String id : ids) {
                Optional<ImageMetadataDocument> image = metadataService.getImageById(id);
                System.out.println("Individual check - ID: " + id + " - Found: " + image.isPresent());
            }
        }

        return ResponseEntity.ok(images);
    }

    // Debug endpoint to check a single image by ID
    @GetMapping("/debug/{id}")
    public ResponseEntity<Object> debugImageById(@PathVariable String id) {
        try {
            Optional<ImageMetadataDocument> image = metadataService.getImageById(id);
            if (image.isPresent()) {
                return ResponseEntity.ok(image.get());
            } else {
                return ResponseEntity.ok(Collections.singletonMap("message", "Image not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.singletonMap("error", "Error finding image: " + e.getMessage()));
        }
    }
}
