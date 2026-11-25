import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const accents = {
  success: "text-emerald-400",
  error: "text-crimson",
  info: "text-gold-light",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success", duration = 4200) => {
      if (!message) return;
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error", 5500),
      info: (message) => push(message, "info"),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
          {toasts.map((item) => {
            const Icon = icons[item.type] || Info;
            return (
              <div
                key={item.id}
                className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border border-white/10 bg-ink/95 px-4 py-3.5 text-cream shadow-[0_20px_50px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl"
                role="status"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${accents[item.type]}`} />
                <p className="flex-1 text-[13px] leading-relaxed text-cream/90">{item.message}</p>
                <button
                  onClick={() => dismiss(item.id)}
                  className="mt-0.5 rounded-full p-0.5 text-cream/40 transition hover:text-cream"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
