package com.phuocloc.backend.storage.dto;

public record CreateBucketResponse(
		String bucketName,
		boolean created
) {
}
