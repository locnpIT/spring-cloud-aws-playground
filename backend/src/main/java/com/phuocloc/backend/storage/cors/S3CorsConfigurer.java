package com.phuocloc.backend.storage.cors;

import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CORSConfiguration;
import software.amazon.awssdk.services.s3.model.CORSRule;
import software.amazon.awssdk.services.s3.model.PutBucketCorsRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component
public class S3CorsConfigurer {

	private final S3Client s3Client;

	public S3CorsConfigurer(S3Client s3Client) {
		this.s3Client = s3Client;
	}

	public void configureCors(String bucketName) {
		try {
			CORSRule corsRule = CORSRule.builder()
					.allowedMethods("GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS")
					.allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000")
					.allowedHeaders("*")
					.exposeHeaders("ETag", "Location", "Content-Length")
					.maxAgeSeconds(3600)
					.build();

			s3Client.putBucketCors(PutBucketCorsRequest.builder()
					.bucket(bucketName)
					.corsConfiguration(CORSConfiguration.builder()
							.corsRules(corsRule)
							.build())
					.build());
		} catch (S3Exception exception) {
			System.err.println("Warning: Failed to configure bucket CORS for " + bucketName + ": " + exception.awsErrorDetails().errorMessage());
		}
	}
}
