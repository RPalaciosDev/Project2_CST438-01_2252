package com.cst438.image.repository;

import com.cst438.image.model.TagFrequencyDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagFrequencyRepository extends MongoRepository<TagFrequencyDocument, String> {
    // The default findById and save methods from MongoRepository are sufficient
}