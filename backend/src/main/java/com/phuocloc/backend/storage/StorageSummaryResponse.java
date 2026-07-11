package com.phuocloc.backend.storage;

import java.util.List;

public record StorageSummaryResponse(
		String configuredBucket,
		List<BucketResponse> buckets
) {
}
