import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const toastStyles = {
  success: { icon: CheckCircle2, classes: 'border-emerald-500/40 bg-emerald-950/95 text-emerald-100' },
  error: { icon: AlertCircle, classes: 'border-red-500/40 bg-red-950/95 text-red-100' },
  info: { icon: Info, classes: 'border-cyan-500/40 bg-slate-900/95 text-slate-100' }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info') => {
    if (!message) return;
    const id = ++nextId.current;
    setToasts(current => [...current.slice(-3), { id, message: String(message), type }]);
    window.setTimeout(() => dismissToast(id), 4200);
  }, [dismissToast]);

  const notify = useMemo(() => ({
    success: message => toast(message, 'success'),
    error: message => toast(message, 'error'),
    info: message => toast(message, 'info')
  }), [toast]);
  const contextValue = useMemo(() => ({ toast: notify, dismissToast }), [notify, dismissToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed right-3 top-3 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2 sm:right-5 sm:top-5" aria-live="polite" aria-relevant="additions">
        {toasts.map(item => {
          const style = toastStyles[item.type] || toastStyles.info;
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${style.classes}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1 leading-5">{item.message}</p>
              <button type="button" onClick={() => dismissToast(item.id)} aria-label="Dismiss notification" className="shrink-0 rounded p-0.5 text-current/70 hover:text-current">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
};
