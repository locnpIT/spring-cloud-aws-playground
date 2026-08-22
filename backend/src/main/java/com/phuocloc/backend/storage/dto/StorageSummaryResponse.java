package com.phuocloc.backend.storage.dto;

import java.util.List;

public record StorageSummaryResponse(
		String configuredBucket,
		List<BucketResponse> buckets
) {
}
