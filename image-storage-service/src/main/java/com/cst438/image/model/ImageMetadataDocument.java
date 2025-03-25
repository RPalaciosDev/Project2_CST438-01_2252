package com.cst438.image.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "images") // Maps this class to the "images" collection in MongoDB.
public class ImageMetadataDocument {

    @Id // Marks this field as the primary key.
    private String id;
    private String fileName; // The name of the file.
    private String s3Url; // The S3 URL of the file.
    private String uploadedBy; // The user who uploaded the file.
    private String s3Key; // The S3 key of the file.
    private long size; // The size of the file in bytes.
    private String folder; // The folder where the file is stored.

    public ImageMetadataDocument() {}

    public ImageMetadataDocument(String fileName, String s3Url, String uploadedBy, String folder) {
        this.fileName = fileName;
        this.s3Url = s3Url;
        this.uploadedBy = uploadedBy;
        this.folder = folder;
    }

    public String getId() { return id; }
    public String getFileName() { return fileName; }
    public String getS3Url() { return s3Url; }
    public String getUploadedBy() { return uploadedBy; }
    public String getS3Key() { return s3Key; }
    public long getSize() { return size; }
    public String getFolder() { return folder; }

    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setS3Url(String s3Url) { this.s3Url = s3Url; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public void setSize(long size) { this.size = size; }
    public void setFolder(String folder) { this.folder = folder; }

    @Override
    public String toString() {
        return "ImageMetadataDocument{" +
                "id='" + id + '\'' +
                ", fileName='" + fileName + '\'' +
                ", s3Url='" + s3Url + '\'' +
                ", uploadedBy='" + uploadedBy + '\'' +
                ", s3Key='" + s3Key + '\'' +
                ", size=" + size +
                ", folder='" + folder + '\'' +
                '}';
    }
}
