package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping
public class HealthController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "service", "subjects-service",
                "version", "1.0.0",
                "status", "running"
        );
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "service", "subjects-service",
                "status", "healthy"
        );
    }
}
