package com.cst438.image.repository;

import com.cst438.image.model.ImageMetadataDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ImageMetadataRepository extends MongoRepository<ImageMetadataDocument, String> {
    // Add this method to query by file name
    Optional<ImageMetadataDocument> findByFileName(String fileName);
}


