package com.phuocloc.backend.health;

import com.phuocloc.backend.common.api.ApiResponse;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	private final String applicationName;

	public HealthController(@Value("${spring.application.name}") String applicationName) {
		this.applicationName = applicationName;
	}

	@GetMapping("/api/health")
	public ApiResponse<HealthResponse> health() {
		HealthResponse response = new HealthResponse("UP", applicationName, Instant.now());
		return ApiResponse.success("Application is healthy", response);
	}
}
