package com.phuocloc.backend.storage.dto;

import java.time.Instant;

public record PresignedUploadResponse(
		String bucketName,
		String objectKey,
		String uploadUrl,
		Instant expiresAt
) {
}
