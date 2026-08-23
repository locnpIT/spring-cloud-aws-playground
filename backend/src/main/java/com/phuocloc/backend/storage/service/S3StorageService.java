package com.phuocloc.backend.storage.service;

import com.phuocloc.backend.config.AwsProperties;
import com.phuocloc.backend.storage.cors.S3CorsConfigurer;
import com.phuocloc.backend.storage.dto.BucketResponse;
import com.phuocloc.backend.storage.dto.FileListResponse;
import com.phuocloc.backend.storage.dto.CreateBucketResponse;
import com.phuocloc.backend.storage.dto.PresignedUploadResponse;
import com.phuocloc.backend.storage.dto.StoredFileResponse;
import com.phuocloc.backend.storage.dto.StorageSummaryResponse;
import java.io.InputStream;
import java.time.Instant;
import java.time.Duration;
import java.util.List;
import software.amazon.awssdk.core.ResponseInputStream;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class S3StorageService {

	private final S3Client s3Client;
	private final S3Presigner s3Presigner;
	private final AwsProperties awsProperties;
	private final S3CorsConfigurer corsConfigurer;

	public S3StorageService(S3Client s3Client, S3Presigner s3Presigner, AwsProperties awsProperties, S3CorsConfigurer corsConfigurer) {
		this.s3Client = s3Client;
		this.s3Presigner = s3Presigner;
		this.awsProperties = awsProperties;
		this.corsConfigurer = corsConfigurer;
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
			corsConfigurer.configureCors(bucketName);
			return new CreateBucketResponse(bucketName, true);
		} catch (BucketAlreadyOwnedByYouException | BucketAlreadyExistsException exception) {
			corsConfigurer.configureCors(bucketName);
			return new CreateBucketResponse(bucketName, false);
		} catch (S3Exception exception) {
			throw new IllegalStateException("Failed to create bucket: " + exception.awsErrorDetails().errorMessage(), exception);
		}
	}

	public PresignedUploadResponse createPresignedUploadUrl(String fileName, String contentType) {
		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}
		ensureBucketWithCors(bucketName);

		if (fileName == null || fileName.isBlank()) {
			throw new IllegalArgumentException("File name is required");
		}

		String safeFileName = fileName.replaceAll("\\s+", "-");
		String objectKey = Instant.now().toEpochMilli() + "-" + safeFileName;

		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucketName)
				.key(objectKey)
				.contentType(contentType)
				.build();

		PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(
				PutObjectPresignRequest.builder()
						.signatureDuration(Duration.ofMinutes(10))
						.putObjectRequest(putObjectRequest)
						.build()
		);

		return new PresignedUploadResponse(
				bucketName,
				objectKey,
				presignedRequest.url().toString(),
				Instant.now().plus(Duration.ofMinutes(10))
		);
	}

	public void ensureBucketExists(String bucketName) {
		try {
			s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
		} catch (S3Exception exception) {
			throw new IllegalStateException("Configured bucket does not exist: " + bucketName, exception);
		}
	}

	private void ensureBucketWithCors(String bucketName) {
		ensureBucketExists(bucketName);
		corsConfigurer.configureCors(bucketName);
	}


	public FileListResponse listFiles() {
		String bucketName = awsProperties.s3().bucketName();
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalStateException("Configured bucket name is required");
		}
		ensureBucketWithCors(bucketName);

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
		ensureBucketWithCors(bucketName);

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
		ensureBucketWithCors(bucketName);

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
