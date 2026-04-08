import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

let toastId = 0;
let addToastFn = null;

export function toast(message, type = 'success') {
  addToastFn?.({ id: ++toastId, message, type });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => setToasts(prev => [...prev, t]);
    return () => { addToastFn = null; };
  }, []);

  function remove(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: { bg: 'rgba(0,224,192,0.08)', border: 'rgba(0,224,192,0.2)', color: '#00E0C0' },
    error:   { bg: 'rgba(224,85,85,0.08)', border: 'rgba(224,85,85,0.2)', color: '#E05555' },
    warning: { bg: 'rgba(224,112,80,0.08)', border: 'rgba(224,112,80,0.2)', color: '#E07050' },
  };
  const s = styles[t.type] || styles.success;

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] animate-slide-up"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {t.type === 'success' && <CheckCircle2 size={14} strokeWidth={1.5} />}
      {t.type === 'error' && <AlertTriangle size={14} strokeWidth={1.5} />}
      {t.type === 'warning' && <AlertTriangle size={14} strokeWidth={1.5} />}
      <span className="flex-1">{t.message}</span>
      <button onClick={onRemove} className="opacity-50 hover:opacity-100"><X size={14} strokeWidth={1.5} /></button>
    </div>
  );
}
