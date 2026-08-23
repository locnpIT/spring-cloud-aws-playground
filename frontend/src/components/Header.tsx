"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HealthResponse } from "@/types";
import { api } from "@/services/api";
import { Cloud, Activity, RefreshCw, CheckCircle2, AlertCircle, Server } from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefreshAll, isRefreshing }: HeaderProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsHealthLoading(true);
    const start = performance.now();
    try {
      const data = await api.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealth(data);
      setIsOnline(data.status === "UP");
    } catch {
      setIsOnline(false);
      setHealth(null);
      setLatency(null);
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoBadge}>
            <Cloud className={styles.cloudIcon} size={24} />
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandTitleRow}>
              <h1 className={styles.title}>AWS Playground</h1>
              <span className={styles.badgeS3}>S3 Storage</span>
            </div>
            <p className={styles.subtitle}>Spring Boot 4.0.7 &bull; AWS SDK v2 &bull; Next.js</p>
          </div>
        </div>

        {/* Status and Actions */}
        <div className={styles.actions}>
          {/* Health Badge */}
          <div
            className={`${styles.healthCard} ${
              isOnline ? styles.healthOnline : styles.healthOffline
            }`}
            title={
              isOnline
                ? `Backend is UP (${latency}ms) - ${health?.applicationName}`
                : "Cannot reach Spring Boot backend on localhost:8080"
            }
          >
            <div className={styles.statusDot}>
              {isOnline ? (
                <span className={styles.pulsingDot} />
              ) : (
                <span className={styles.offlineDot} />
              )}
            </div>
            <div className={styles.healthInfo}>
              <div className={styles.healthStatus}>
                {isOnline ? (
                  <>
                    <CheckCircle2 size={13} className={styles.statusIcon} />
                    <span>Spring Backend UP</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} className={styles.statusIcon} />
                    <span>Backend Offline</span>
                  </>
                )}
              </div>
              <div className={styles.healthMeta}>
                {isOnline && latency !== null ? (
                  <span>
                    <Activity size={11} /> {latency}ms
                  </span>
                ) : (
                  <span>Port 8080</span>
                )}
                {health?.applicationName && (
                  <span>
                    <Server size={11} /> {health.applicationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => {
              checkHealth();
              onRefreshAll();
            }}
            disabled={isRefreshing || isHealthLoading}
            className={styles.refreshBtn}
            title="Refresh system status and storage data"
          >
            <RefreshCw
              size={16}
              className={isRefreshing || isHealthLoading ? styles.spinning : ""}
            />
            <span className={styles.refreshText}>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
