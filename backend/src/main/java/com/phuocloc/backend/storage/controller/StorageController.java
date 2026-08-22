package com.phuocloc.backend.storage.controller;

import com.phuocloc.backend.common.api.ApiResponse;
import com.phuocloc.backend.storage.dto.CreateBucketRequest;
import com.phuocloc.backend.storage.dto.CreateBucketResponse;
import com.phuocloc.backend.storage.dto.FileListResponse;
import com.phuocloc.backend.storage.dto.StorageSummaryResponse;
import com.phuocloc.backend.storage.dto.UploadFileResponse;
import com.phuocloc.backend.storage.service.S3StorageService;
import com.phuocloc.backend.storage.service.S3StorageService.DeleteFileResult;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

	@PostMapping("/buckets")
	public ApiResponse<CreateBucketResponse> createBucket(@Valid @RequestBody CreateBucketRequest request) {
		return ApiResponse.success("S3 bucket created", storageService.createBucket(request.bucketName()));
	}

	@PostMapping(value = "/files", consumes = "multipart/form-data")
	public ApiResponse<UploadFileResponse> uploadFile(@RequestPart("file") MultipartFile file) {
		return ApiResponse.success("File uploaded to S3", storageService.uploadFile(file));
	}

	@GetMapping("/files")
	public ApiResponse<FileListResponse> listFiles() {
		return ApiResponse.success("S3 files retrieved", storageService.listFiles());
	}

	@GetMapping("/files/{objectKey}")
	public ResponseEntity<InputStreamResource> downloadFile(@PathVariable String objectKey) {
		S3StorageService.DownloadedFile file = storageService.downloadFile(objectKey);
		String fileName = objectKey;
		String contentDisposition = file.contentDisposition();
		if (contentDisposition == null || contentDisposition.isBlank()) {
			contentDisposition = ContentDisposition.attachment()
					.filename(URLEncoder.encode(fileName, StandardCharsets.UTF_8))
					.build()
					.toString();
		}

		HttpHeaders headers = new HttpHeaders();
		headers.setContentDisposition(ContentDisposition.parse(contentDisposition));
		if (file.contentType() != null && !file.contentType().isBlank()) {
			headers.setContentType(MediaType.parseMediaType(file.contentType()));
		}
		if (file.contentLength() != null) {
			headers.setContentLength(file.contentLength());
		}

		return ResponseEntity.ok()
				.headers(headers)
				.body(new InputStreamResource(file.inputStream()));
	}

	@DeleteMapping("/files/{objectKey}")
	public ApiResponse<DeleteFileResult> deleteFile(@PathVariable String objectKey) {
		return ApiResponse.success("S3 file deleted", storageService.deleteFile(objectKey));
	}
}
