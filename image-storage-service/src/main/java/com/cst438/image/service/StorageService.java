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

@Service
public class StorageService {

    private final S3Client s3Client;
    private final ImageMetadataRepository metadataRepository;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    public StorageService(S3Client s3Client, ImageMetadataRepository metadataRepository) {
        this.s3Client = s3Client;
        this.metadataRepository = metadataRepository;
    }

    @PostConstruct
    public void init() {
        // Log the AWS credentials and bucket information
        System.out.println("AWS Access Key: " + System.getenv("AWS_ACCESS_KEY_ID"));
        System.out.println("AWS Bucket Name: " + bucketName);
        System.out.println("AWS Region: " + region);
    }

    /**
     * Syncs all images from AWS S3 into MongoDB.
     * If an image exists in S3 but not in MongoDB, it will be added.
     */
    public void syncS3ToMongo() {
        System.out.println("📢 syncS3ToMongo() method called!");

        ListObjectsV2Request request = ListObjectsV2Request.builder().bucket(bucketName).build();
        ListObjectsV2Response result = s3Client.listObjectsV2(request);

        if (result.contents().isEmpty()) {
            System.out.println("⚠️ No files found in S3 bucket: " + bucketName);
        }

        for (S3Object s3Object : result.contents()) {
            System.out.println("🔍 Checking: " + s3Object.key());

            String fileKey = s3Object.key();
            String fileUrl = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileKey;

            Optional<ImageMetadataDocument> existing = metadataRepository.findByFileName(fileKey);
            if (existing.isPresent()) {
                System.out.println("Already exists in MongoDB: " + fileKey);
                continue;
            }

            ImageMetadataDocument metadata = new ImageMetadataDocument();
            metadata.setFileName(fileKey);
            metadata.setS3Key(fileKey);
            metadata.setS3Url(fileUrl);
            metadata.setSize(s3Object.size());
            metadata.setUploadedBy("auto-sync");
            metadataRepository.save(metadata);

            System.out.println("Stored in MongoDB: " + fileUrl);
        }

        System.out.println("syncS3ToMongo() completed.");
    }
}
