import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }} className="animate-fade-in">
            <span style={styles.icon}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="var(--status-success)" />}
              {toast.type === 'error' && <AlertCircle size={18} color="var(--status-danger)" />}
              {toast.type === 'info' && <Info size={18} color="var(--accent-primary)" />}
            </span>
            <span style={styles.message}>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={styles.closeBtn}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = {
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '380px',
    width: '100%',
    pointerEvents: 'none'
  },
  toast: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-surface-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    fontSize: '0.875rem'
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '10px'
  },
  message: {
    flex: 1,
    fontWeight: 500
  },
  closeBtn: {
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center'
  }
};
