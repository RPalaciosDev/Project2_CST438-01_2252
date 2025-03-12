package com.cst438.image.service;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.repository.ImageMetadataRepository;
import org.springframework.stereotype.Service;
import java.util.List;

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
}

