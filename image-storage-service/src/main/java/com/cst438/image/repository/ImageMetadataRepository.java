package com.cst438.image.repository;

import com.cst438.image.model.ImageMetadataDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository // Marks this interface as a Spring repository.
public interface ImageMetadataRepository extends MongoRepository<ImageMetadataDocument, String> {

    /**
     * Finds an image by its file name.
     * @param fileName The name of the file.
     * @return An optional containing the image metadata document.
     */
    Optional<ImageMetadataDocument> findByFileName(String fileName);

    /**
     * Finds images by their folder.
     * @param folder The folder containing the images.
     * @return A list of image metadata documents.
     */
    List<ImageMetadataDocument> findByFolder(String folder);

    /**
     * Finds images by their IDs.
     * @param ids The list of IDs.
     * @return A list of image metadata documents.
     */
    List<ImageMetadataDocument> findByIdIn(List<String> ids);

    /**
     * Custom query to find images by string IDs.
     * @param ids The list of string IDs.
     * @return A list of image metadata documents.
     */
    @Query("{ '_id': { $in: ?0 } }")
    List<ImageMetadataDocument> findByStringIds(List<String> ids);
}
