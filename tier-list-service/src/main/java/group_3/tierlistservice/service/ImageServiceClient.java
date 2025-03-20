package group_3.tierlistservice.service;

import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse.ImageMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class ImageServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ImageServiceClient.class);
    private final WebClient webClient;

    public ImageServiceClient(@Qualifier("imageServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
        log.info("ImageServiceClient initialized with WebClient baseUrl: {}",
                webClient.toString());
    }

    /**
     * Fetches images by their IDs from the image storage service
     *
     * @param imageIds List of image IDs to fetch
     * @return List of image metadata objects
     */
    public List<ImageMetadata> getImagesByIds(List<String> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            log.info("No image IDs provided, returning empty list");
            return Collections.emptyList();
        }

        // Get the client's base URL as a string
        WebClient.Builder builder = webClient.mutate();
        String baseUrl = builder.build().toString();
        // Extract actual URL from the toString representation
        if (baseUrl.contains("@")) {
            baseUrl = baseUrl.substring(baseUrl.indexOf("@") + 1);
        }
        // Add protocol if missing
        if (!baseUrl.startsWith("http")) {
            baseUrl = "https://" + baseUrl;
        }
        String fullUrl = baseUrl + "/api/images/bulk";

        log.info("Fetching {} images from image service", imageIds.size());
        log.info("Base URL: {}", baseUrl);
        log.info("Full request URL: {}", fullUrl);
        log.info("Image IDs to fetch: {}", imageIds);

        try {
            log.info("Making POST request to /api/images/bulk with {} image IDs", imageIds.size());
            return webClient.post()
                    .uri("/api/images/bulk")
                    .bodyValue(imageIds)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .doOnNext(map -> log.info("Received image data: id={}", map.get("id")))
                    .map(this::mapToImageMetadata)
                    .doOnNext(img -> log.info("Mapped to ImageMetadata: id={}, url={}", img.getId(), img.getS3Url()))
                    .collectList()
                    .doOnError(e -> {
                        if (e instanceof WebClientResponseException) {
                            WebClientResponseException wcre = (WebClientResponseException) e;
                            log.error("HTTP Error response from image service: Status: {}, Body: {}",
                                    wcre.getStatusCode(), wcre.getResponseBodyAsString(), e);
                        } else if (e instanceof WebClientException) {
                            log.error("WebClient error details: {}", e.toString(), e);
                        } else {
                            log.error("Error fetching images from image service: {}", e.getMessage(), e);
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Falling back to empty list due to error: {}", e.getMessage());
                        return Mono.just(Collections.emptyList());
                    })
                    .block();
        } catch (WebClientResponseException e) {
            log.error("HTTP Error response: Status: {}, Body: {}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            return Collections.emptyList();
        } catch (WebClientException e) {
            log.error("WebClient exception: {}", e.getMessage(), e);
            log.error("WebClient exception class: {}", e.getClass().getName());
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error when fetching images: {} ({})", e.getMessage(), e.getClass().getName(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Maps a response from the image service to our internal ImageMetadata model
     */
    private ImageMetadata mapToImageMetadata(Map<String, Object> response) {
        try {
            return ImageMetadata.builder()
                    .id((String) response.get("id"))
                    .fileName((String) response.get("fileName"))
                    .s3Url((String) response.get("s3Url"))
                    .uploadedBy((String) response.get("uploadedBy"))
                    .folder((String) response.get("folder"))
                    .build();
        } catch (Exception e) {
            log.error("Error mapping image metadata: {} - Response data: {}", e.getMessage(), response, e);
            throw e;
        }
    }
}