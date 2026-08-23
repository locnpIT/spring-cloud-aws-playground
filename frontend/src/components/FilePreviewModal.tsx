"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StoredFile } from "@/types";
import { api } from "@/services/api";
import { formatBytes } from "./StorageStats";
import { getFileTypeIcon } from "./FileUploadZone";
import { useToast } from "@/context/ToastContext";
import {
  X,
  Download,
  Copy,
  Check,
  Calendar,
  HardDrive,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import styles from "./FilePreviewModal.module.css";

interface FilePreviewModalProps {
  file: StoredFile | null;
  bucketName: string;
  onClose: () => void;
}

export function FilePreviewModal({
  file,
  bucketName,
  onClose,
}: FilePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { error } = useToast();

  const isImage = (filename: string) =>
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(filename);
  const isTextOrCode = (filename: string) =>
    /\.(txt|md|json|js|ts|tsx|jsx|html|css|xml|yml|yaml|sql|java|py|sh)$/i.test(
      filename
    );

  const fetchContent = useCallback(async (key: string) => {
    setIsLoading(true);
    setTextContent(null);
    setPreviewUrl(null);

    try {
      const { blob, contentType } = await api.getFileBlob(key);

      if (isImage(key) || contentType.startsWith("image/")) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else if (
        isTextOrCode(key) ||
        contentType.startsWith("text/") ||
        contentType.includes("json")
      ) {
        const text = await blob.text();
        // Limit text preview to first 10,000 characters
        setTextContent(
          text.length > 10000 ? text.substring(0, 10000) + "\n...[truncated]" : text
        );
      }
    } catch {
      // Preview might not be supported or error occurred
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      fetchContent(file.key);
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, fetchContent]);

  if (!file) return null;

  const s3Uri = `s3://${bucketName}/${file.key}`;

  const handleCopyUri = () => {
    navigator.clipboard.writeText(s3Uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await api.downloadFile(file.key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      error("Download Error", msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = file.lastModified
    ? new Date(file.lastModified).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.fileIcon}>{getFileTypeIcon(file.key)}</div>
            <div className={styles.headerMeta}>
              <h3 className={styles.title} title={file.key}>
                {file.key}
              </h3>
              <span className={styles.subtext}>S3 Object Details & Preview</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.body}>
          {/* Metadata Card */}
          <div className={styles.metaCard}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <HardDrive size={13} /> S3 URI
              </span>
              <div className={styles.uriRow}>
                <code className={styles.uriCode}>{s3Uri}</code>
                <button
                  onClick={handleCopyUri}
                  className={styles.copyBtn}
                  title="Copy S3 URI"
                >
                  {copied ? (
                    <Check size={14} className={styles.copiedIcon} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Bucket</span>
                <span className={styles.metaValue}>{bucketName}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Size</span>
                <span className={styles.metaValue}>{formatBytes(file.size)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  <Calendar size={13} /> Last Modified
                </span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <Eye size={15} />
              <span>Preview</span>
            </div>

            <div className={styles.previewContainer}>
              {isLoading ? (
                <div className={styles.loadingBox}>
                  <Loader2 size={24} className={styles.spinning} />
                  <span>Loading preview...</span>
                </div>
              ) : previewUrl ? (
                <div className={styles.imageBox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={file.key}
                    className={styles.previewImage}
                  />
                </div>
              ) : textContent !== null ? (
                <pre className={styles.codeBox}>
                  <code>{textContent}</code>
                </pre>
              ) : (
                <div className={styles.noPreviewBox}>
                  <ExternalLink size={28} className={styles.noPreviewIcon} />
                  <p>Binary or unsupported format for inline preview.</p>
                  <span>Use Download below to inspect the file locally.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={styles.downloadBtn}
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className={styles.spinning} />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Object</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
