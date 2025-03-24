package com.cst438.image.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;
import java.util.HashMap;

/**
 * Document that stores the frequency of each tag in the image database.
 * This is used to optimize the tier-builder UI by pre-computing tag frequencies
 * instead of calculating them on the client side.
 */
@Document(collection = "tag_frequencies")
public class TagFrequencyDocument {

    @Id
    private String id = "tag_frequencies"; // Single document with fixed ID
    private Map<String, Integer> frequencies = new HashMap<>();
    private long lastUpdated;

    public TagFrequencyDocument() {
        this.lastUpdated = System.currentTimeMillis();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Map<String, Integer> getFrequencies() {
        return frequencies;
    }

    public void setFrequencies(Map<String, Integer> frequencies) {
        this.frequencies = frequencies;
    }

    public long getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(long lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    /**
     * Updates the frequency of a tag.
     * 
     * @param tag   The tag to update
     * @param count The new count
     */
    public void updateTag(String tag, int count) {
        frequencies.put(tag, count);
        this.lastUpdated = System.currentTimeMillis();
    }

    /**
     * Increments the frequency of a tag by 1.
     * 
     * @param tag The tag to increment
     */
    public void incrementTag(String tag) {
        int currentCount = frequencies.getOrDefault(tag, 0);
        frequencies.put(tag, currentCount + 1);
        this.lastUpdated = System.currentTimeMillis();
    }

    @Override
    public String toString() {
        return "TagFrequencyDocument{" +
                "id='" + id + '\'' +
                ", frequencies=" + frequencies +
                ", lastUpdated=" + lastUpdated +
                '}';
    }
}