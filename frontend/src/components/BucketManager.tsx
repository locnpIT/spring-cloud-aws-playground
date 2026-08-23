"use client";

import React, { useState } from "react";
import { BucketItem } from "@/types";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { FolderPlus, Check, Globe, Calendar, X, Loader2, Database } from "lucide-react";
import styles from "./BucketManager.module.css";

interface BucketManagerProps {
  buckets: BucketItem[];
  targetBucket: string;
  isLoading: boolean;
  onBucketCreated: () => void;
}

export function BucketManager({
  buckets,
  targetBucket,
  isLoading,
  onBucketCreated,
}: BucketManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { success, error, warning } = useToast();

  const validateBucketName = (name: string): string | null => {
    if (!name.trim()) return "Bucket name is required.";
    if (name.length < 3 || name.length > 63) {
      return "Must be between 3 and 63 characters long.";
    }
    if (!/^[a-z0-9.-]+$/.test(name)) {
      return "Can only contain lowercase letters, numbers, hyphens (-), and periods (.).";
    }
    if (/^[.-]|[.-]$/.test(name)) {
      return "Must start and end with a letter or number.";
    }
    if (/\.{2,}/.test(name)) {
      return "Cannot contain two consecutive periods.";
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/\s+/g, "-");
    setNewBucketName(value);
    if (validationError) {
      setValidationError(validateBucketName(value));
    }
  };

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateBucketName(newBucketName);
    if (err) {
      setValidationError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createBucket(newBucketName.trim());
      if (res.created) {
        success("Bucket Created", `S3 Bucket '${res.bucketName}' was successfully created.`);
      } else {
        warning("Bucket Exists", `Bucket '${res.bucketName}' already exists or is owned by you.`);
      }
      setIsModalOpen(false);
      setNewBucketName("");
      onBucketCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create bucket";
      error("Create Bucket Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Database size={18} className={styles.titleIcon} />
          <h3 className={styles.title}>S3 Buckets</h3>
          <span className={styles.countBadge}>{buckets.length}</span>
        </div>
        <button
          onClick={() => {
            setValidationError(null);
            setIsModalOpen(true);
          }}
          className={styles.createBtn}
        >
          <FolderPlus size={16} />
          <span>Create Bucket</span>
        </button>
      </div>

      {/* Bucket Badges/List */}
      <div className={styles.bucketList}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonBadge}`} />
          ))
        ) : buckets.length === 0 ? (
          <div className={styles.empty}>
            <span>No buckets found in this AWS account / LocalStack.</span>
          </div>
        ) : (
          buckets.map((b) => {
            const isTarget = b.name === targetBucket;
            const createdDate = b.creationDate
              ? new Date(b.creationDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={b.name}
                className={`${styles.bucketCard} ${isTarget ? styles.targetBucketCard : ""}`}
                title={`S3 Bucket: ${b.name}${createdDate ? ` (Created: ${createdDate})` : ""}`}
              >
                <div className={styles.bucketIcon}>
                  <Globe size={15} />
                </div>
                <div className={styles.bucketMeta}>
                  <span className={styles.bucketName}>{b.name}</span>
                  {createdDate && (
                    <span className={styles.creationDate}>
                      <Calendar size={11} /> {createdDate}
                    </span>
                  )}
                </div>
                {isTarget && (
                  <span className={styles.activeTag}>
                    <Check size={12} /> Active
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Bucket Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <FolderPlus size={20} className={styles.modalIcon} />
                <h3>Create New S3 Bucket</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBucket} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="bucketName">Bucket Name</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="bucketName"
                    type="text"
                    placeholder="e.g. my-app-assets-2026"
                    value={newBucketName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    autoFocus
                    className={`${styles.input} ${validationError ? styles.inputError : ""}`}
                  />
                </div>
                {validationError && (
                  <span className={styles.errorText}>{validationError}</span>
                )}
                <div className={styles.hint}>
                  <span>&bull; Must be globally unique across AWS</span>
                  <span>&bull; Lowercase letters, numbers, and hyphens only</span>
                  <span>&bull; Length between 3 and 63 characters</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newBucketName.trim()}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinning} />
                      <span>Creating on S3...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus size={16} />
                      <span>Create Bucket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
