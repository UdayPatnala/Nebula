import { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Inline Toast Container rendering for overlays */}
      <div 
        className="toast-container" 
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-md)',
          right: 'var(--spacing-md)',
          zIndex: 'var(--z-index-toast)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
          maxWidth: '350px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-surface)',
              border: `1px solid var(--color-border)`,
              borderLeft: `5px solid var(--color-${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : toast.type === 'warning' ? 'warning' : 'info'})`,
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'slideIn 0.2s ease',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-label)'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                marginLeft: 'var(--spacing-sm)',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
