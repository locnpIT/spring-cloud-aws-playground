package com.phuocloc.backend.storage;

import com.phuocloc.backend.config.AwsProperties;
import java.util.List;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;

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
}
