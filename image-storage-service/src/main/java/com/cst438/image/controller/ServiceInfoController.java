package com.cst438.image.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Controller for providing information about the Image Storage Service.
 * This provides an easily accessible endpoint to explain the service
 * capabilities.
 */
@RestController // Marks this class as a REST controller.
public class ServiceInfoController {

    @Value("${spring.application.name:image-storage-service}")
    private String applicationName;

    @Value("${app.domain:imageapi-production-af11.up.railway.app}")
    private String appDomain;

    // Record the start time when the controller is initialized
    private final long startTime = System.currentTimeMillis();

    @GetMapping("/service-info") // Endpoint to retrieve service information.
    public ResponseEntity<Map<String, Object>> getServiceInfo() {
        Map<String, Object> serviceInfo = new HashMap<>();
        long uptime = System.currentTimeMillis() - startTime;

        serviceInfo.put("service", applicationName);
        serviceInfo.put("status", "operational");
        serviceInfo.put("uptime_ms", uptime);
        serviceInfo.put("version", "1.0.0");
        serviceInfo.put("description", "Image Storage Service for the LoveTiers application");
        serviceInfo.put("domain", appDomain);

        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("GET /service-info", "Returns information about this service");
        endpoints.put("GET /api/images", "Returns metadata for all stored images");
        endpoints.put("POST /api/images/store",
                "Stores metadata for an image (requires fileName, s3Url, uploadedBy parameters)");
        endpoints.put("POST /api/images/sync", "Synchronizes S3 images with MongoDB storage");

        Map<String, String> capabilities = new HashMap<>();
        capabilities.put("storage", "Amazon S3 for image files");
        capabilities.put("metadata", "MongoDB for image metadata");
        capabilities.put("thumbnails", "Automatic thumbnail generation");

        serviceInfo.put("endpoints", endpoints);
        serviceInfo.put("capabilities", capabilities);

        return ResponseEntity.ok(serviceInfo);
    }

    // Adding a root level endpoint that redirects to service-info
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getRootInfo() {
        return getServiceInfo();
    }

    /**
     * Enhanced endpoint optimized for curl requests that provides comprehensive
     * service information
     * Usage: curl http://localhost:8080/api/info
     */
    @GetMapping("/api/info")
    public ResponseEntity<Map<String, Object>> getCurlFriendlyInfo() {
        Map<String, Object> info = new HashMap<>();

        // Basic service information
        info.put("service", applicationName);
        info.put("status", "operational");
        info.put("version", "1.0.0");
        info.put("description", "Image Storage Service for the LoveTiers application");

        // System information
        Map<String, Object> systemInfo = new HashMap<>();
        RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
        systemInfo.put("jvm", System.getProperty("java.version"));
        systemInfo.put("os", System.getProperty("os.name") + " " + System.getProperty("os.version"));
        systemInfo.put("memory_max", Runtime.getRuntime().maxMemory() / (1024 * 1024) + "MB");
        systemInfo.put("memory_free", Runtime.getRuntime().freeMemory() / (1024 * 1024) + "MB");
        systemInfo.put("processors", Runtime.getRuntime().availableProcessors());

        // Calculate uptime
        long uptime = System.currentTimeMillis() - startTime;
        long days = TimeUnit.MILLISECONDS.toDays(uptime);
        long hours = TimeUnit.MILLISECONDS.toHours(uptime) % 24;
        long minutes = TimeUnit.MILLISECONDS.toMinutes(uptime) % 60;
        long seconds = TimeUnit.MILLISECONDS.toSeconds(uptime) % 60;

        Map<String, Object> uptimeInfo = new HashMap<>();
        uptimeInfo.put("start_time", new Date(startTime).toString());
        uptimeInfo.put("uptime_formatted",
                String.format("%d days, %d hours, %d minutes, %d seconds", days, hours, minutes, seconds));
        uptimeInfo.put("uptime_milliseconds", uptime);

        // API Endpoints
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("GET /api/info", "Returns basic service information (this endpoint)");
        endpoints.put("GET /service-info", "Returns detailed service information and capabilities");
        endpoints.put("GET /api/images", "Returns metadata for all stored images");
        endpoints.put("POST /api/images/store", "Stores metadata for an image");
        endpoints.put("POST /api/images/sync", "Synchronizes S3 images with MongoDB storage");

        // Add all sections to the response
        info.put("system", systemInfo);
        info.put("uptime", uptimeInfo);
        info.put("endpoints", endpoints);
        info.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(info);
    }
}