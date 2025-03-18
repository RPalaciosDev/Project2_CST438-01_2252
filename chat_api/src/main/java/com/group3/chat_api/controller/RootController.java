package com.group3.chat_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping
    public Map<String, String> getRoot() {
        return Map.of(
                "service", "Chat Service",
                "status", "UP",
                "version", "0.1.0");
    }
}