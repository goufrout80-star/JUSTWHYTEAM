import { Play, Square } from 'lucide-react';
import { formatTime } from '../../hooks/useTimeTracker';

export default function TimeTracker({ taskId, timerSeconds = 0, activeTaskId, elapsed, onStart, onStop }) {
  const isActive = activeTaskId === taskId;
  const totalDisplay = formatTime(timerSeconds + (isActive ? elapsed : 0));

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <button onClick={onStop}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors timer-active"
          style={{ background: 'rgba(224,85,85,0.1)', color: 'var(--status-overdue)', border: '1px solid rgba(224,85,85,0.2)' }}>
          <Square size={10} strokeWidth={1.5} />
          <span className="tabular-nums font-mono">{formatTime(elapsed)}</span>
        </button>
      ) : (
        <button onClick={() => onStart(taskId)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors"
          style={{ background: 'rgba(0,224,192,0.06)', color: 'var(--text-accent)', border: '1px solid var(--border-default)' }}>
          <Play size={10} strokeWidth={1.5} />
          Start
        </button>
      )}
      {timerSeconds > 0 && !isActive && (
        <span className="text-[11px] tabular-nums font-mono" style={{ color: 'var(--text-hint)' }}>{totalDisplay}</span>
      )}
    </div>
  );
}
