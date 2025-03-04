package com.cst438.image.controller;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.service.ImageMetadataService;
import com.cst438.image.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @RequestParam String uploadedBy) {

        ImageMetadataDocument savedMetadata = metadataService.storeImageUrl(fileName, s3Url, uploadedBy);
        return ResponseEntity.ok(savedMetadata);
    }

    @GetMapping
    public ResponseEntity<List<ImageMetadataDocument>> getAllImages() {
        List<ImageMetadataDocument> images = metadataService.getAllImages();
        return ResponseEntity.ok(images);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncImages() {
        storageService.syncS3ToMongo();
        return ResponseEntity.ok("S3 Images Synced to MongoDB");
    }
}
