import {
  ApiResponse,
  CreateBucketResponse,
  FileListResponse,
  HealthResponse,
  PresignedUploadResponse,
  StorageSummaryResponse,
  UploadFileResponse,
  DeleteFileResult,
} from "@/types";

const API_BASE = "";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `HTTP error ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // Ignored if non-json error
    }
    throw new Error(errorDetail);
  }
  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/api/health`, {
      cache: "no-store",
    });
    return handleResponse<HealthResponse>(res);
  },

  async listBuckets(): Promise<StorageSummaryResponse> {
    const res = await fetch(`${API_BASE}/api/storage/buckets`, {
      cache: "no-store",
    });
    return handleResponse<StorageSummaryResponse>(res);
  },

  async createBucket(bucketName: string): Promise<CreateBucketResponse> {
    const res = await fetch(`${API_BASE}/api/storage/buckets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucketName }),
    });
    return handleResponse<CreateBucketResponse>(res);
  },

  async listFiles(): Promise<FileListResponse> {
    const res = await fetch(`${API_BASE}/api/storage/files`, {
      cache: "no-store",
    });
    const result = await handleResponse<FileListResponse>(res);
    return {
      ...result,
      files: result.files.map((file: any) => ({
        key: file.key ?? file.objectKey ?? "",
        size: file.size ?? 0,
        lastModified: file.lastModified ?? "",
      })),
    };
  },

  async uploadFile(file: File): Promise<UploadFileResponse> {
    const presignRes = await fetch(`${API_BASE}/api/storage/files/presign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
    const presigned = await handleResponse<PresignedUploadResponse>(presignRes);

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to S3 (${uploadRes.status} ${uploadRes.statusText})`);
    }

    return {
      bucketName: presigned.bucketName,
      objectKey: presigned.objectKey,
      originalFileName: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    };
  },

  async downloadFile(objectKey: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/storage/files/${encodeURIComponent(objectKey)}`);
    if (!res.ok) {
      throw new Error(`Failed to download file (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Extract filename or fallback to objectKey
    let filename = objectKey.split("/").pop() || objectKey;
    // Remove timestamp prefix if standard format like 172900000-filename.ext
    const match = filename.match(/^\d+-(.+)$/);
    if (match && match[1]) {
      filename = match[1];
    }
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getFileBlob(objectKey: string): Promise<{ blob: Blob; contentType: string }> {
    const res = await fetch(`${API_BASE}/api/storage/files/${encodeURIComponent(objectKey)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch file content (${res.status} ${res.statusText})`);
    }
    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const blob = await res.blob();
    return { blob, contentType };
  },

  async deleteFile(objectKey: string): Promise<DeleteFileResult> {
    const res = await fetch(`${API_BASE}/api/storage/files/${encodeURIComponent(objectKey)}`, {
      method: "DELETE",
    });
    return handleResponse<DeleteFileResult>(res);
  },
};
