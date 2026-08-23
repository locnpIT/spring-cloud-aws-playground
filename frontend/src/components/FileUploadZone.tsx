"use client";

import React, { useState, useRef } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { formatBytes } from "./StorageStats";
import {
  UploadCloud,
  File as FileIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  Film,
  FileText,
} from "lucide-react";
import styles from "./FileUploadZone.module.css";

interface FileUploadZoneProps {
  onUploadSuccess: () => void;
  targetBucket: string;
}

interface QueuedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
}

export function getFileTypeIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext) || mimeType?.startsWith("image/")) {
    return <ImageIcon size={18} className={styles.iconImage} />;
  }
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext) || mimeType?.startsWith("video/")) {
    return <Film size={18} className={styles.iconVideo} />;
  }
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) {
    return <FileArchive size={18} className={styles.iconArchive} />;
  }
  if (["js", "ts", "jsx", "tsx", "java", "py", "json", "html", "css", "sql", "yml", "yaml", "xml"].includes(ext)) {
    return <FileCode size={18} className={styles.iconCode} />;
  }
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
    return <FileText size={18} className={styles.iconDoc} />;
  }
  return <FileIcon size={18} className={styles.iconGeneric} />;
}

export function FileUploadZone({ onUploadSuccess, targetBucket }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      status: "pending",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = "";
    }
  };

  const removeQueuedFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((item) => item.status === "pending" || item.status === "error");
    if (pending.length === 0) return;

    setIsUploadingAll(true);
    let successCount = 0;

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q))
      );

      try {
        await api.uploadFile(item.file);
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q))
        );
        successCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", errorMsg } : q))
        );
      }
    }

    setIsUploadingAll(false);

    if (successCount > 0) {
      success(
        "Upload Complete",
        `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""} to bucket '${targetBucket}'.`
      );
      onUploadSuccess();
    } else {
      error("Upload Failed", "Could not upload files to S3. Please verify backend connection.");
    }
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== "success"));
  };

  const pendingCount = queue.filter((item) => item.status === "pending" || item.status === "error").length;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        <div className={styles.dropzoneIcon}>
          <UploadCloud size={38} />
        </div>
        <div className={styles.dropzoneText}>
          <h4>
            <span>Click to upload</span> or drag and drop files
          </h4>
          <p>
            Upload any file to active bucket <strong className={styles.bucketHighlight}>{targetBucket}</strong>
          </p>
        </div>
      </div>

      {/* Queue Area */}
      {queue.length > 0 && (
        <div className={styles.queueContainer}>
          <div className={styles.queueHeader}>
            <span className={styles.queueTitle}>
              Selected Files ({queue.length})
            </span>
            <div className={styles.queueActions}>
              {queue.some((i) => i.status === "success") && (
                <button onClick={clearCompleted} className={styles.clearBtn}>
                  Clear Uploaded
                </button>
              )}
              <button
                onClick={handleUploadAll}
                disabled={isUploadingAll || pendingCount === 0}
                className={styles.uploadAllBtn}
              >
                {isUploadingAll ? (
                  <>
                    <Loader2 size={15} className={styles.spinning} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Upload {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.queueList}>
            {queue.map((item) => (
              <div key={item.id} className={`${styles.queueItem} ${styles[item.status]}`}>
                <div className={styles.fileIcon}>
                  {getFileTypeIcon(item.file.name, item.file.type)}
                </div>
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{item.file.name}</span>
                  <div className={styles.fileMeta}>
                    <span>{formatBytes(item.file.size)}</span>
                    {item.status === "error" && item.errorMsg && (
                      <span className={styles.errorLabel}>{item.errorMsg}</span>
                    )}
                  </div>
                </div>
                <div className={styles.itemStatus}>
                  {item.status === "uploading" && (
                    <Loader2 size={16} className={styles.spinning} />
                  )}
                  {item.status === "success" && (
                    <CheckCircle size={16} className={styles.successIcon} />
                  )}
                  {item.status === "error" && (
                    <AlertCircle size={16} className={styles.errorIcon} />
                  )}
                  {item.status !== "uploading" && (
                    <button
                      onClick={() => removeQueuedFile(item.id)}
                      className={styles.removeBtn}
                      title="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
