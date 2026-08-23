export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  timestamp: string;
}

export interface HealthResponse {
  status: "UP" | "DOWN" | string;
  applicationName: string;
  timestamp: string;
}

export interface BucketItem {
  name: string;
  creationDate: string | null;
}

export interface StorageSummaryResponse {
  targetBucket: string;
  buckets: BucketItem[];
}

export interface CreateBucketRequest {
  bucketName: string;
}

export interface CreateBucketResponse {
  bucketName: string;
  created: boolean;
}

export interface StoredFile {
  key: string;
  size: number;
  lastModified: string;
}

export interface FileListResponse {
  bucketName: string;
  files: StoredFile[];
}

export interface UploadFileResponse {
  bucketName: string;
  objectKey: string;
  originalFileName: string;
  size: number;
  contentType: string;
}

export interface PresignedUploadResponse {
  bucketName: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface DeleteFileResult {
  bucketName: string;
  objectKey: string;
  deleted: boolean;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
