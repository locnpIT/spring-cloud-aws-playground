package com.phuocloc.backend.storage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateBucketRequest(
		@NotBlank(message = "Bucket name is required")
		@Pattern(
				regexp = "^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$",
				message = "Bucket name must be 3 to 63 characters long and contain only lowercase letters, numbers, dots, and hyphens"
		)
		String bucketName
) {
}
