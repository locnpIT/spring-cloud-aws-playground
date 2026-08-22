package com.phuocloc.backend.storage.dto;

import java.time.Instant;

public record BucketResponse(
		String name,
		Instant creationDate
) {
}
