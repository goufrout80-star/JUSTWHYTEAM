import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(table, filter, callback) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${filter?.column || 'all'}-${filter?.value || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value, callback]);
}
