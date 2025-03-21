package com.cst438.image.repository;

import com.cst438.image.model.ImageMetadataDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ImageMetadataRepository extends MongoRepository<ImageMetadataDocument, String> {
    Optional<ImageMetadataDocument> findByFileName(String fileName);

    List<ImageMetadataDocument> findByFolder(String folder);

    List<ImageMetadataDocument> findByIdIn(List<String> ids);

    // Custom query to find by string IDs
    @Query("{ '_id': { $in: ?0 } }")
    List<ImageMetadataDocument> findByStringIds(List<String> ids);
}
