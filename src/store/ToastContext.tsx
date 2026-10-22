import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createId } from '../lib/text';
import type { TranslationKey } from '../i18n';

export type ToastKind = 'success' | 'error' | 'info';
/** A param can be literal text or another translation key, resolved when rendered. */
export type ToastParam = string | number | { key: TranslationKey };

export interface Toast {
  id: string;
  kind: ToastKind;
  message: TranslationKey;
  params?: Record<string, ToastParam>;
}

interface ToastContextValue {
  toasts: Toast[];
  notify: (kind: ToastKind, message: TranslationKey, params?: Record<string, ToastParam>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = { success: 4000, info: 4000, error: 8000 } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const notify = useCallback<ToastContextValue['notify']>(
    (kind, message, params) => {
      const id = createId();
      setToasts((list) => [...list.slice(-3), { id, kind, message, params }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION_MS[kind]));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
