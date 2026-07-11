package com.phuocloc.backend.config;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.aws")
public record AwsProperties(
		String region,
		URI endpointUrl,
		S3 s3
) {

	public boolean hasEndpointOverride() {
		return endpointUrl != null && endpointUrl.isAbsolute();
	}

	public record S3(
			String bucketName
	) {
	}
}
