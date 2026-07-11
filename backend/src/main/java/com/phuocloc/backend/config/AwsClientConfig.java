package com.phuocloc.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
public class AwsClientConfig {

	@Bean
	public S3Client s3Client(AwsProperties awsProperties) {
		S3ClientBuilder builder = S3Client.builder()
				.region(Region.of(awsProperties.region()))
				.credentialsProvider(DefaultCredentialsProvider.builder().build());

		if (awsProperties.hasEndpointOverride()) {
			builder.endpointOverride(awsProperties.endpointUrl());
		}

		return builder.build();
	}
}
