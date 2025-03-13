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
}
