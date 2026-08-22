package com.phuocloc.backend.storage.service;

import com.phuocloc.backend.config.AwsProperties;
import com.phuocloc.backend.storage.dto.BucketResponse;
import com.phuocloc.backend.storage.dto.FileListResponse;
import com.phuocloc.backend.storage.dto.CreateBucketResponse;
import com.phuocloc.backend.storage.dto.StoredFileResponse;
import com.phuocloc.backend.storage.dto.UploadFileResponse;
import com.phuocloc.backend.storage.dto.StorageSummaryResponse;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class S3StorageService {

	private final S3Client s3Client;
	private final AwsProperties awsProperties;

	public S3StorageService(S3Client s3Client, AwsProperties awsProperties) {
		this.s3Client = s3Client;
		this.awsProperties = awsProperties;
	}

	public StorageSummaryResponse listBuckets() {
		List<BucketResponse> buckets = s3Client.listBuckets().buckets().stream()
				.map(bucket -> new BucketResponse(bucket.name(), bucket.creationDate()))
				.toList();

		return new StorageSummaryResponse(awsProperties.s3().bucketName(), buckets);
	}

	public CreateBucketResponse createBucket(String bucketName) {
		try {
			s3Client.createBucket(CreateBucketRequest.builder()
					.bucket(bucketName)
					.build());
			return new CreateBucketResponse(bucketName, true);
		} catch (BucketAlreadyOwnedByYouException | BucketAlreadyExistsException exception) {
			return new CreateBucketResponse(bucketName, false);
		} catch (S3Exception exception) {
			throw new IllegalStateException("Failed to create bucket: " + exception.awsErrorDetails().errorMessage(), exception);
		}
	}

	public UploadFileResponse uploadFile(MultipartFile file) {
		if (file.isEmpty()) {
			throw new IllegalArgumentException("File is required");
		}

		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}

		String originalFileName = file.getOriginalFilename();
		String safeFileName = originalFileName == null || originalFileName.isBlank()
				? "file"
				: originalFileName.replaceAll("\\s+", "-").toLowerCase(Locale.ROOT);
		String objectKey = Instant.now().toEpochMilli() + "-" + safeFileName;

		try {
			s3Client.putObject(
					PutObjectRequest.builder()
							.bucket(bucketName)
							.key(objectKey)
							.contentType(file.getContentType())
							.contentLength(file.getSize())
							.build(),
					RequestBody.fromInputStream(file.getInputStream(), file.getSize())
			);
			return new UploadFileResponse(bucketName, objectKey, file.getOriginalFilename(), file.getSize(), file.getContentType());
		} catch (IOException exception) {
			throw new IllegalStateException("Failed to read file content", exception);
		} catch (S3Exception exception) {
			throw new IllegalStateException("Failed to upload file: " + exception.awsErrorDetails().errorMessage(), exception);
		}
	}

	public FileListResponse listFiles() {
		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}

		List<StoredFileResponse> files = s3Client.listObjectsV2(ListObjectsV2Request.builder()
						.bucket(bucketName)
						.build())
				.contents()
				.stream()
				.map(object -> new StoredFileResponse(object.key(), object.size(), object.lastModified()))
				.toList();

		return new FileListResponse(bucketName, files);
	}

	public DownloadedFile downloadFile(String objectKey) {
		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}

		try {
			ResponseInputStream<GetObjectResponse> response = s3Client.getObject(GetObjectRequest.builder()
					.bucket(bucketName)
					.key(objectKey)
					.build());

			return new DownloadedFile(
					response.response().contentType(),
					response.response().contentLength(),
					response.response().contentDisposition(),
					response
			);
		} catch (NoSuchBucketException | NoSuchKeyException exception) {
			throw new FileNotFoundException("File not found: " + objectKey, exception);
		} catch (S3Exception exception) {
			throw new IllegalStateException("Failed to download file: " + exception.awsErrorDetails().errorMessage(), exception);
		}
	}

	public DeleteFileResult deleteFile(String objectKey) {
		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}

		try {
			s3Client.deleteObject(DeleteObjectRequest.builder()
					.bucket(bucketName)
					.key(objectKey)
					.build());
			return new DeleteFileResult(bucketName, objectKey, true);
		} catch (NoSuchBucketException | NoSuchKeyException exception) {
			throw new FileNotFoundException("File not found: " + objectKey, exception);
		} catch (S3Exception exception) {
			throw new IllegalStateException("Failed to delete file: " + exception.awsErrorDetails().errorMessage(), exception);
		}
	}

	public record DownloadedFile(
			String contentType,
			Long contentLength,
			String contentDisposition,
			InputStream inputStream
	) {
	}

	public record DeleteFileResult(
			String bucketName,
			String objectKey,
			boolean deleted
	) {
	}

	public static class FileNotFoundException extends RuntimeException {
		public FileNotFoundException(String message, Throwable cause) {
			super(message, cause);
		}
	}
}
