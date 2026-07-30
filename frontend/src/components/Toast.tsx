import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "error" | "success";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 5000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card flex items-start gap-2 p-3 text-sm shadow-lg pointer-events-auto ${
              t.kind === "error" ? "border-coral/40" : "border-signal/40"
            }`}
          >
            {t.kind === "error" ? (
              <AlertCircle size={16} className="text-coral shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={16} className="text-signal shrink-0 mt-0.5" />
            )}
            <span className="flex-1 text-ink-100">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-ink-500 hover:text-ink-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// Pulls a readable message out of an axios-style error, with a safe fallback.
export function errorMessage(err: any, fallback = "Something went wrong. Please try again.") {
  return err?.response?.data?.error || fallback;
}
