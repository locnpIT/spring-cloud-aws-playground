package com.phuocloc.backend.health;

import java.time.Instant;

public record HealthResponse(
		String status,
		String application,
		Instant timestamp
) {
}
