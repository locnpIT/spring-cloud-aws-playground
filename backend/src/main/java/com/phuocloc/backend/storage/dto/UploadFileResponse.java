package com.phuocloc.backend.storage.dto;

public record UploadFileResponse(
		String bucketName,
		String objectKey,
		String originalFileName,
		long size,
		String contentType
) {
}
