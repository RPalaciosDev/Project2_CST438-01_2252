package com.cst438.image.service;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.repository.ImageMetadataRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service // Marks this class as a Spring service.
public class ImageMetadataService {

    private final ImageMetadataRepository metadataRepository;

    public ImageMetadataService(ImageMetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }

    /**
     * Stores metadata for an image.
     * @param fileName The name of the file.
     * @param s3Url The S3 URL of the file.
     * @param uploadedBy The user who uploaded the file.
     * @param folder The folder where the file is stored.
     * @return The saved metadata document.
     */
    public ImageMetadataDocument storeImageUrl(String fileName, String s3Url, String uploadedBy, String folder) {
        ImageMetadataDocument metadata = new ImageMetadataDocument(fileName, s3Url, uploadedBy, folder);
        return metadataRepository.save(metadata);
    }

    /**
     * Retrieves all stored images.
     * @return A list of all image metadata documents.
     */
    public List<ImageMetadataDocument> getAllImages() {
        return metadataRepository.findAll();
    }

    /**
     * Retrieves images by folder.
     * @param folder The folder to search for images.
     * @return A list of image metadata documents in the specified folder.
     */
    public List<ImageMetadataDocument> getImagesByFolder(String folder) {
        return metadataRepository.findByFolder(folder);
    }

    /**
     * Retrieves images by their IDs.
     * @param ids The list of image IDs.
     * @return A list of image metadata documents with the specified IDs.
     */
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

    /**
     * Retrieves an image by its ID.
     * @param id The ID of the image.
     * @return An optional containing the image metadata document if found, or empty if not found.
     */
    public Optional<ImageMetadataDocument> getImageById(String id) {
        return metadataRepository.findById(id);
    }
}
