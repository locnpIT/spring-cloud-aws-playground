"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BucketItem, StoredFile } from "@/types";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { Header } from "@/components/Header";
import { StorageStats } from "@/components/StorageStats";
import { BucketManager } from "@/components/BucketManager";
import { FileUploadZone } from "@/components/FileUploadZone";
import { FileList } from "@/components/FileList";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import styles from "./page.module.css";

export default function DashboardPage() {
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [targetBucket, setTargetBucket] = useState<string>("");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);

  const { error } = useToast();

  const fetchBuckets = useCallback(async () => {
    setIsLoadingBuckets(true);
    try {
      const data = await api.listBuckets();
      setBuckets(data.buckets || []);
      setTargetBucket(data.targetBucket || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load buckets";
      error("Error Loading S3 Buckets", msg);
    } finally {
      setIsLoadingBuckets(false);
    }
  }, [error]);

  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const data = await api.listFiles();
      setFiles(data.files || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load files";
      error("Error Loading S3 Files", msg);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [error]);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchBuckets(), fetchFiles()]);
    setIsRefreshing(false);
  }, [fetchBuckets, fetchFiles]);

  useEffect(() => {
    handleRefreshAll();
  }, [handleRefreshAll]);

  const totalBytes = useMemo(() => {
    return files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [files]);

  return (
    <div className={styles.page}>
      <Header onRefreshAll={handleRefreshAll} isRefreshing={isRefreshing} />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Storage Overview Metrics */}
          <StorageStats
            targetBucket={targetBucket}
            totalBuckets={buckets.length}
            totalFiles={files.length}
            totalBytes={totalBytes}
            isLoading={isLoadingBuckets || isLoadingFiles}
          />

          {/* S3 Bucket Manager Section */}
          <BucketManager
            buckets={buckets}
            targetBucket={targetBucket}
            isLoading={isLoadingBuckets}
            onBucketCreated={handleRefreshAll}
          />

          {/* File Upload Section */}
          <FileUploadZone
            onUploadSuccess={fetchFiles}
            targetBucket={targetBucket || "S3 Bucket"}
          />

          {/* S3 Stored Objects & Explorer */}
          <FileList
            files={files}
            bucketName={targetBucket}
            isLoading={isLoadingFiles}
            onFileDeleted={fetchFiles}
            onPreviewFile={(file) => setPreviewFile(file)}
          />
        </div>
      </main>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        bucketName={targetBucket}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
