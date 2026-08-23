"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastMessage, ToastType } from "@/types";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import styles from "./Toast.module.css";

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, message?: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast(title, message, "success"), [toast]);
  const error = useCallback((title: string, message?: string) => toast(title, message, "error", 5500), [toast]);
  const warning = useCallback((title: string, message?: string) => toast(title, message, "warning"), [toast]);
  const info = useCallback((title: string, message?: string) => toast(title, message, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`${styles.toast} ${styles[item.type]}`}>
            <div className={styles.icon}>
              {item.type === "success" && <CheckCircle2 size={20} />}
              {item.type === "error" && <AlertCircle size={20} />}
              {item.type === "warning" && <AlertTriangle size={20} />}
              {item.type === "info" && <Info size={20} />}
            </div>
            <div className={styles.content}>
              <h4 className={styles.title}>{item.title}</h4>
              {item.message && <p className={styles.message}>{item.message}</p>}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className={styles.closeBtn}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
