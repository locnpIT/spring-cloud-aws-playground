"use client";

import React from "react";
import { Database, HardDrive, Files, ShieldCheck } from "lucide-react";
import styles from "./StorageStats.module.css";

interface StorageStatsProps {
  targetBucket: string;
  totalBuckets: number;
  totalFiles: number;
  totalBytes: number;
  isLoading: boolean;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function StorageStats({
  targetBucket,
  totalBuckets,
  totalFiles,
  totalBytes,
  isLoading,
}: StorageStatsProps) {
  return (
    <div className={styles.grid}>
      {/* Active Bucket */}
      <div className={`${styles.card} ${styles.cardCyan}`}>
        <div className={styles.iconWrapper}>
          <HardDrive size={22} className={styles.icon} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Active Target Bucket</span>
          {isLoading ? (
            <div className={`skeleton ${styles.skeletonText}`} />
          ) : (
            <h3 className={styles.value} title={targetBucket || "Not Configured"}>
              {targetBucket || "default-bucket"}
            </h3>
          )}
          <span className={styles.subtext}>Configured via AWS S3 Client</span>
        </div>
      </div>

      {/* Total Buckets */}
      <div className={`${styles.card} ${styles.cardBlue}`}>
        <div className={styles.iconWrapper}>
          <Database size={22} className={styles.icon} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Total S3 Buckets</span>
          {isLoading ? (
            <div className={`skeleton ${styles.skeletonNumber}`} />
          ) : (
            <h3 className={styles.value}>{totalBuckets}</h3>
          )}
          <span className={styles.subtext}>Available in region</span>
        </div>
      </div>

      {/* Total Files */}
      <div className={`${styles.card} ${styles.cardPurple}`}>
        <div className={styles.iconWrapper}>
          <Files size={22} className={styles.icon} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Objects Stored</span>
          {isLoading ? (
            <div className={`skeleton ${styles.skeletonNumber}`} />
          ) : (
            <h3 className={styles.value}>{totalFiles}</h3>
          )}
          <span className={styles.subtext}>In current bucket</span>
        </div>
      </div>

      {/* Storage Used */}
      <div className={`${styles.card} ${styles.cardEmerald}`}>
        <div className={styles.iconWrapper}>
          <ShieldCheck size={22} className={styles.icon} />
        </div>
        <div className={styles.content}>
          <span className={styles.label}>Storage Footprint</span>
          {isLoading ? (
            <div className={`skeleton ${styles.skeletonNumber}`} />
          ) : (
            <h3 className={styles.value}>{formatBytes(totalBytes)}</h3>
          )}
          <span className={styles.subtext}>Aggregated object size</span>
        </div>
      </div>
    </div>
  );
}
