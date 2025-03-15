package group_3.tierlistservice.service;

import group_3.tierlistservice.dto.TierlistTemplateWithImagesResponse.ImageMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class ImageServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ImageServiceClient.class);
    private final WebClient webClient;

    @Autowired
    public ImageServiceClient(@Qualifier("imageServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Fetches images by their IDs from the image storage service
     *
     * @param imageIds List of image IDs to fetch
     * @return List of image metadata objects
     */
    public List<ImageMetadata> getImagesByIds(List<String> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return webClient.post()
                    .uri("/api/images/bulk")
                    .bodyValue(imageIds)
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .map(this::mapToImageMetadata)
                    .collectList()
                    .onErrorResume(e -> {
                        log.error("Error fetching images from image service: {}", e.getMessage());
                        return Mono.just(Collections.emptyList());
                    })
                    .block();
        } catch (WebClientException e) {
            log.error("Error connecting to image service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Maps a response from the image service to our internal ImageMetadata model
     */
    private ImageMetadata mapToImageMetadata(Map<String, Object> response) {
        return ImageMetadata.builder()
                .id((String) response.get("id"))
                .fileName((String) response.get("fileName"))
                .s3Url((String) response.get("s3Url"))
                .uploadedBy((String) response.get("uploadedBy"))
                .folder((String) response.get("folder"))
                .build();
    }
}