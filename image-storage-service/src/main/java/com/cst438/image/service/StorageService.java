package com.cst438.image.service;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.repository.ImageMetadataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import javax.annotation.PostConstruct;
import java.util.Optional;

@Service // Marks this class as a Spring service.
public class StorageService {

    private final S3Client s3Client;
    private final ImageMetadataRepository metadataRepository;
    private final TagService tagService;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    public StorageService(S3Client s3Client, ImageMetadataRepository metadataRepository, TagService tagService) {
        this.s3Client = s3Client;
        this.metadataRepository = metadataRepository;
        this.tagService = tagService;
    }

    @PostConstruct // Executes after the bean is initialized.
    public void init() {
        System.out.println("AWS Bucket Name: " + bucketName);
    }

    /**
     * Syncs all images from AWS S3 into MongoDB.
     * If an image exists in S3 but not in MongoDB, it will be added.
     * Also updates the tag frequencies collection after syncing.
     */
    public void syncS3ToMongo() {
        System.out.println("syncS3ToMongo() method called!");
        boolean imagesAdded = false;

        try {
            // List all objects in the S3 bucket.
            ListObjectsV2Request request = ListObjectsV2Request.builder().bucket(bucketName).build();
            ListObjectsV2Response result = s3Client.listObjectsV2(request);

            for (S3Object s3Object : result.contents()) {
                String fileKey = s3Object.key();
                if (fileKey.endsWith("/")) continue; // Skip empty folders.

                // Construct the S3 file URL.
                String fileUrl = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileKey;


                // Determine the folder name.
                String folder = fileKey.contains("/") ? fileKey.substring(0, fileKey.lastIndexOf('/')) : "root";

                // Check if the file already exists in MongoDB.
                Optional<ImageMetadataDocument> existing = metadataRepository.findByFileName(fileKey);
                if (existing.isPresent())
                    continue;

                // Create and save metadata for the new file.
                ImageMetadataDocument metadata = new ImageMetadataDocument();
                metadata.setFileName(fileKey);
                metadata.setS3Key(fileKey);
                metadata.setS3Url(fileUrl);
                metadata.setSize(s3Object.size());
                metadata.setUploadedBy("auto-sync");
                metadata.setFolder(folder);

                metadataRepository.save(metadata);
                imagesAdded = true;
                System.out.println("Stored in MongoDB: " + fileUrl + " (Folder: " + folder + ")");
            }

            System.out.println("syncS3ToMongo() completed.");

            // If any new images were added or this is the first sync, update tag
            // frequencies
            if (imagesAdded || tagService.getTagFrequencies().getFrequencies().isEmpty()) {
                System.out.println("New images detected or first sync - updating tag frequencies");
                tagService.updateTagFrequencies();
            }
        } catch (software.amazon.awssdk.services.s3.model.S3Exception e) {
            System.err.println("Error syncing S3 images to MongoDB: " + e.getMessage());
            System.err.println("Error details: " + e.awsErrorDetails());
            System.err.println("Request ID: " + e.requestId());
            System.err.println("Extended Request ID: " + e.extendedRequestId());
            if (e.awsErrorDetails() != null) {
                System.err.println("Error code: " + e.awsErrorDetails().errorCode());
                System.err.println("Error message: " + e.awsErrorDetails().errorMessage());
            }
            throw e;
        }
    }
}
