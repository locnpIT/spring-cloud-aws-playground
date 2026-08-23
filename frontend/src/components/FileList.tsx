"use client";

import React, { useState, useMemo } from "react";
import { StoredFile } from "@/types";
import { api } from "@/services/api";
import { formatBytes } from "./StorageStats";
import { getFileTypeIcon } from "./FileUploadZone";
import { useToast } from "@/context/ToastContext";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Calendar,
  Layers,
} from "lucide-react";
import styles from "./FileList.module.css";

interface FileListProps {
  files: StoredFile[];
  bucketName: string;
  isLoading: boolean;
  onFileDeleted: () => void;
  onPreviewFile: (file: StoredFile) => void;
}

type FilterCategory = "all" | "images" | "documents" | "media" | "code" | "archives";

export function FileList({
  files,
  bucketName,
  isLoading,
  onFileDeleted,
  onPreviewFile,
}: FileListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const { success, error } = useToast();

  const getCategory = (key: string): FilterCategory => {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext)) return "images";
    if (["pdf", "doc", "docx", "txt", "md", "csv", "xlsx"].includes(ext)) return "documents";
    if (["mp4", "mov", "webm", "mp3", "wav", "mkv"].includes(ext)) return "media";
    if (["js", "ts", "jsx", "tsx", "java", "py", "json", "html", "css", "sql", "yml", "yaml", "xml"].includes(ext))
      return "code";
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) return "archives";
    return "documents";
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const fileKey = f.key ?? "";
      const matchesSearch = fileKey.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory === "all") return true;
      return getCategory(fileKey) === selectedCategory;
    });
  }, [files, searchTerm, selectedCategory]);

  const handleDownload = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingKey(key);
    try {
      await api.downloadFile(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      error("Download Failed", msg);
    } finally {
      setDownloadingKey(null);
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setDeletingKey(fileToDelete.key);
    try {
      await api.deleteFile(fileToDelete.key);
      success("Object Deleted", `File '${fileToDelete.key}' was removed from bucket '${bucketName}'.`);
      setFileToDelete(null);
      onFileDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      error("Delete Failed", msg);
    } finally {
      setDeletingKey(null);
    }
  };

  const getCleanName = (key: string) => {
    const match = key.match(/^\d+-(.+)$/);
    return match ? match[1] : key;
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search S3 objects by filename or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className={styles.clearSearchBtn}>
              &times;
            </button>
          )}
        </div>

        {/* View Mode & Count */}
        <div className={styles.toolbarActions}>
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode("table")}
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              title="Table view"
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
              title="Grid cards view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className={styles.categories}>
        {(["all", "images", "documents", "media", "code", "archives"] as FilterCategory[]).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.categoryPill} ${
                selectedCategory === cat ? styles.categoryPillActive : ""
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          )
        )}
      </div>

      {/* File Content Area */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <FolderOpen size={40} className={styles.emptyIcon} />
          </div>
          <h4>No files found</h4>
          <p>
            {searchTerm || selectedCategory !== "all"
              ? "No S3 objects match your search criteria."
              : `Bucket '${bucketName}' is currently empty. Use the upload zone above to add files.`}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Object Key</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th className={styles.alignRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const formattedDate = file.lastModified
                  ? new Date(file.lastModified).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";

                return (
                  <tr
                    key={file.key}
                    onClick={() => onPreviewFile(file)}
                    className={styles.tableRow}
                  >
                    <td>
                      <div className={styles.fileCell}>
                        <div className={styles.fileIcon}>
                          {getFileTypeIcon(file.key)}
                        </div>
                        <div className={styles.fileNameInfo}>
                          <span className={styles.cleanName}>{getCleanName(file.key)}</span>
                          <span className={styles.rawKey}>{file.key}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.sizeCell}>{formatBytes(file.size)}</td>
                    <td className={styles.dateCell}>{formattedDate}</td>
                    <td className={styles.alignRight} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => onPreviewFile(file)}
                          className={styles.actionBtn}
                          title="Preview & Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDownload(file.key, e)}
                          disabled={downloadingKey === file.key}
                          className={styles.actionBtn}
                          title="Download File"
                        >
                          {downloadingKey === file.key ? (
                            <Loader2 size={15} className={styles.spinning} />
                          ) : (
                            <Download size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => setFileToDelete(file)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Delete from S3"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className={styles.grid}>
          {filteredFiles.map((file) => {
            const formattedDate = file.lastModified
              ? new Date(file.lastModified).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            return (
              <div
                key={file.key}
                onClick={() => onPreviewFile(file)}
                className={styles.gridCard}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.gridIcon}>
                    {getFileTypeIcon(file.key)}
                  </div>
                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDownload(file.key, e)}
                      disabled={downloadingKey === file.key}
                      className={styles.actionBtn}
                      title="Download"
                    >
                      {downloadingKey === file.key ? (
                        <Loader2 size={14} className={styles.spinning} />
                      ) : (
                        <Download size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => setFileToDelete(file)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h4 className={styles.cardTitle} title={file.key}>
                    {getCleanName(file.key)}
                  </h4>
                  <span className={styles.cardKey}>{file.key}</span>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.cardSize}>
                    <Layers size={12} /> {formatBytes(file.size)}
                  </span>
                  <span className={styles.cardDate}>
                    <Calendar size={12} /> {formattedDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className={styles.modalOverlay} onClick={() => setFileToDelete(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.dangerIconWrapper}>
                <AlertTriangle size={24} className={styles.dangerIcon} />
              </div>
              <div>
                <h3>Delete S3 Object</h3>
                <p>Are you sure you want to permanently delete this object?</p>
              </div>
            </div>

            <div className={styles.deleteDetails}>
              <div className={styles.deleteRow}>
                <span>Bucket:</span>
                <code>{bucketName}</code>
              </div>
              <div className={styles.deleteRow}>
                <span>Object Key:</span>
                <code>{fileToDelete.key}</code>
              </div>
              <div className={styles.deleteRow}>
                <span>Size:</span>
                <span>{formatBytes(fileToDelete.size)}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={deletingKey !== null}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingKey !== null}
                className={styles.confirmDeleteBtn}
              >
                {deletingKey ? (
                  <>
                    <Loader2 size={16} className={styles.spinning} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
