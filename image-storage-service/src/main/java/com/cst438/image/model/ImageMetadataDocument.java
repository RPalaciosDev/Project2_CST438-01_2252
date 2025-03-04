package com.cst438.image.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "images") // Ensure this matches your MongoDB collection name
public class ImageMetadataDocument {

    @Id
    private String id;
    private String fileName;
    private String s3Url;
    private String uploadedBy;
    private String s3Key;  // Added missing field
    private long size;  // Added missing field

    // No-Args Constructor (Required for MongoDB & Serialization)
    public ImageMetadataDocument() {}

    // Constructor with parameters
    public ImageMetadataDocument(String fileName, String s3Url, String uploadedBy) {
        this.fileName = fileName;
        this.s3Url = s3Url;
        this.uploadedBy = uploadedBy;
    }

    // Getters and Setters
    public String getId() { return id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getS3Url() { return s3Url; }
    public void setS3Url(String s3Url) { this.s3Url = s3Url; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    // Override toString() for debugging
    @Override
    public String toString() {
        return "ImageMetadataDocument{" +
                "id='" + id + '\'' +
                ", fileName='" + fileName + '\'' +
                ", s3Url='" + s3Url + '\'' +
                ", uploadedBy='" + uploadedBy + '\'' +
                ", s3Key='" + s3Key + '\'' +
                ", size=" + size +
                '}';
    }
}
