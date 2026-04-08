import { useAuth } from '../../context/AuthContext';
import { Eye, AlertTriangle } from 'lucide-react';

export default function ImpersonateBanner() {
  const { impersonating, stopImpersonating, user } = useAuth();
  if (!impersonating) return null;

  return (
    <div className="px-4 py-3 flex items-center justify-center gap-3 text-[13px] font-medium"
      style={{ 
        background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)', 
        color: '#1F2937', 
        borderBottom: '2px solid #B45309',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
      }}>
      <AlertTriangle size={16} strokeWidth={2} />
      <Eye size={14} strokeWidth={2} />
      <span className="font-semibold">
        ADMIN MODE: Impersonating <strong>{impersonating.username}</strong> (ID: {impersonating.id?.slice(0,8)})
      </span>
      <span className="mx-2 opacity-60">|</span>
      <span className="text-[11px] opacity-80">
        Actions are logged • Password changes disabled
      </span>
      <button onClick={stopImpersonating}
        className="ml-4 px-4 py-1.5 rounded text-[12px] font-bold transition-all"
        style={{ 
          background: '#1F2937', 
          color: '#F59E0B', 
          border: '2px solid #1F2937',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={e => {
          e.target.style.background = '#000';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.target.style.background = '#1F2937';
          e.target.style.transform = 'scale(1)';
        }}>
        EXIT IMPERSONATION
      </button>
    </div>
  );
}
