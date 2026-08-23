package com.phuocloc.backend.storage.dto;

import jakarta.validation.constraints.NotBlank;

public record PresignUploadRequest(
		@NotBlank(message = "File name is required")
		String fileName,
		String contentType
) {
}
