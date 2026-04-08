import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTimeTracker(userId) {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startTimer = useCallback(async (taskId) => {
    if (activeTaskId) await stopTimer();
    const now = new Date().toISOString();
    const { data } = await supabase.from('time_sessions').insert({
      task_id: taskId, user_id: userId, started_at: now,
    }).select().single();
    await supabase.from('tasks').update({
      timer_running: true, timer_started_at: now,
    }).eq('id', taskId);
    setSessionId(data?.id);
    setActiveTaskId(taskId);
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [activeTaskId, userId]);

  const stopTimer = useCallback(async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (!sessionId || !activeTaskId) return;
    const now = new Date().toISOString();
    await supabase.from('time_sessions').update({
      ended_at: now, duration_seconds: elapsed,
    }).eq('id', sessionId);
    const { data: task } = await supabase.from('tasks').select('timer_seconds').eq('id', activeTaskId).single();
    await supabase.from('tasks').update({
      timer_running: false, timer_started_at: null,
      timer_seconds: (task?.timer_seconds || 0) + elapsed,
    }).eq('id', activeTaskId);
    setActiveTaskId(null);
    setSessionId(null);
    setElapsed(0);
  }, [sessionId, activeTaskId, elapsed]);

  return { activeTaskId, elapsed, startTimer, stopTimer };
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
