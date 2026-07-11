package com.phuocloc.backend.storage;

import java.time.Instant;

public record BucketResponse(
		String name,
		Instant creationDate
) {
}
