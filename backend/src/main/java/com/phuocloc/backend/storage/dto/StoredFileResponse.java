package com.phuocloc.backend.storage.dto;

import java.time.Instant;

public record StoredFileResponse(
		String objectKey,
		Long size,
		Instant lastModified
) {
}
