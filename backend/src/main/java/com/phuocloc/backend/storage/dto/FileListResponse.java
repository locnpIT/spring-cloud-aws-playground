package com.phuocloc.backend.storage.dto;

import java.util.List;

public record FileListResponse(
		String bucketName,
		List<StoredFileResponse> files
) {
}
