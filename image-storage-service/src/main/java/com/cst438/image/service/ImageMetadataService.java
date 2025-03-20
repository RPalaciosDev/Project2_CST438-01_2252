package com.cst438.image.service;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.repository.ImageMetadataRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ImageMetadataService {

    private final ImageMetadataRepository metadataRepository;

    public ImageMetadataService(ImageMetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }

    public ImageMetadataDocument storeImageUrl(String fileName, String s3Url, String uploadedBy, String folder) {
        ImageMetadataDocument metadata = new ImageMetadataDocument(fileName, s3Url, uploadedBy, folder);
        return metadataRepository.save(metadata);
    }

    public List<ImageMetadataDocument> getAllImages() {
        return metadataRepository.findAll();
    }

    public List<ImageMetadataDocument> getImagesByFolder(String folder) {
        return metadataRepository.findByFolder(folder);
    }

    public List<ImageMetadataDocument> getImagesByIds(List<String> ids) {
        System.out.println("getImagesByIds called with IDs: " + ids);

        // Try with the standard method first
        List<ImageMetadataDocument> results = metadataRepository.findByIdIn(ids);
        System.out.println("findByIdIn found " + results.size() + " images");

        // If that didn't work, try with our custom query
        if (results.isEmpty() && !ids.isEmpty()) {
            List<ImageMetadataDocument> customResults = metadataRepository.findByStringIds(ids);
            System.out.println("findByStringIds found " + customResults.size() + " images");
            return customResults;
        }

        return results;
    }

    public Optional<ImageMetadataDocument> getImageById(String id) {
        return metadataRepository.findById(id);
    }
}
