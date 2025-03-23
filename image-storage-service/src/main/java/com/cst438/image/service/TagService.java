package com.cst438.image.service;

import com.cst438.image.model.ImageMetadataDocument;
import com.cst438.image.model.TagFrequencyDocument;
import com.cst438.image.repository.ImageMetadataRepository;
import com.cst438.image.repository.TagFrequencyRepository;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TagService {

    private static final String TAG_FREQUENCIES_ID = "tag_frequencies";
    private final TagFrequencyRepository tagFrequencyRepository;
    private final ImageMetadataRepository imageMetadataRepository;

    public TagService(TagFrequencyRepository tagFrequencyRepository,
            ImageMetadataRepository imageMetadataRepository) {
        this.tagFrequencyRepository = tagFrequencyRepository;
        this.imageMetadataRepository = imageMetadataRepository;
    }

    /**
     * Get all tag frequencies
     * 
     * @return The tag frequencies document
     */
    public TagFrequencyDocument getTagFrequencies() {
        Optional<TagFrequencyDocument> tagFrequencies = tagFrequencyRepository.findById(TAG_FREQUENCIES_ID);

        return tagFrequencies.orElseGet(() -> {
            // If no tag frequencies document exists, calculate it
            updateTagFrequencies();
            return tagFrequencyRepository.findById(TAG_FREQUENCIES_ID)
                    .orElse(new TagFrequencyDocument());
        });
    }

    /**
     * Update tag frequencies by analyzing all images in the database
     */
    public void updateTagFrequencies() {
        System.out.println("Updating tag frequencies...");
        List<ImageMetadataDocument> allImages = imageMetadataRepository.findAll();

        Map<String, Integer> tagCounts = new HashMap<>();

        for (ImageMetadataDocument image : allImages) {
            // Extract tags from the file name, similar to how it's done in tier-builder.tsx
            String fileName = image.getFileName();
            if (fileName != null) {
                String[] parts = fileName.split("/");
                for (String part : parts) {
                    // Skip parts that are empty, have extensions or are too short to be meaningful
                    if (part.trim().isEmpty() || part.contains(".") || part.length() < 2) {
                        continue;
                    }

                    // Increment the count for this tag
                    tagCounts.merge(part, 1, Integer::sum);
                }
            }
        }

        // Store the updated tag frequencies
        TagFrequencyDocument tagFrequencies = tagFrequencyRepository.findById(TAG_FREQUENCIES_ID)
                .orElse(new TagFrequencyDocument());

        tagFrequencies.setFrequencies(tagCounts);
        tagFrequencies.setLastUpdated(System.currentTimeMillis());

        tagFrequencyRepository.save(tagFrequencies);
        System.out.println("Tag frequencies updated: " + tagCounts.size() + " unique tags found");
    }
}