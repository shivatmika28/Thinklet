"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      // Auto-dismiss: 2s for success/info, 4s for errors so critical info is readable
      const autoDismissMs = duration ?? (type === "error" ? 4000 : 2000);

      setToasts((prev) => [...prev, { id, type, message, duration: autoDismissMs }]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, autoDismissMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const error = useCallback((msg: string) => toast(msg, "error"), [toast]);
  const info = useCallback((msg: string) => toast(msg, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      {/* Toast Viewport (Live region) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          width: "calc(100% - 48px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const icon =
            t.type === "success" ? (
              <CheckCircle2
                className="shrink-0"
                style={{ width: "16px", height: "16px", color: "var(--strong)" }}
                aria-hidden="true"
              />
            ) : t.type === "error" ? (
              <AlertCircle
                className="shrink-0"
                style={{ width: "16px", height: "16px", color: "var(--weak)" }}
                aria-hidden="true"
              />
            ) : (
              <Info
                className="shrink-0"
                style={{ width: "16px", height: "16px", color: "var(--okay)" }}
                aria-hidden="true"
              />
            );

          const label = t.type === "success" ? "Success" : t.type === "error" ? "Notice" : "Info";

          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              style={{
                backgroundColor: "var(--raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                pointerEvents: "auto",
                transition: "opacity 250ms var(--ease-standard), transform 250ms var(--ease-standard)",
              }}
              className="animate-card-entrance"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                {icon}
                <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                  <span style={{ fontWeight: 600, marginRight: "6px", color: "var(--heading)" }}>
                    {label}:
                  </span>
                  <span>{t.message}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss message"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="focus-ring hover:text-[var(--text-primary)]"
              >
                <X style={{ width: "14px", height: "14px" }} aria-hidden="true" />
              </button>
            </div>
          );
        })}
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
