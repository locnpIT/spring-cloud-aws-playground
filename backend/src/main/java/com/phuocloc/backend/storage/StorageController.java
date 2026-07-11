package com.phuocloc.backend.storage;

import com.phuocloc.backend.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

	private final S3StorageService storageService;

	public StorageController(S3StorageService storageService) {
		this.storageService = storageService;
	}

	@GetMapping("/buckets")
	public ApiResponse<StorageSummaryResponse> listBuckets() {
		return ApiResponse.success("S3 buckets retrieved", storageService.listBuckets());
	}
}
