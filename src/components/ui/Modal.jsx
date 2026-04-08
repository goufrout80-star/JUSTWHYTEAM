import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto fade-in ${className}`}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded transition-colors" style={{ color: 'var(--text-hint)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
