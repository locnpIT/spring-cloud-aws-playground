package com.phuocloc.backend.common.api;

import java.time.Instant;
import java.util.Map;

public record ApiResponse<T>(
		boolean success,
		String message,
		T data,
		Map<String, String> errors,
		Instant timestamp
) {

	public static <T> ApiResponse<T> success(String message, T data) {
		return new ApiResponse<>(true, message, data, Map.of(), Instant.now());
	}

	public static ApiResponse<Void> failure(String message) {
		return failure(message, Map.of());
	}

	public static ApiResponse<Void> failure(String message, Map<String, String> errors) {
		return new ApiResponse<>(false, message, null, errors, Instant.now());
	}
}
