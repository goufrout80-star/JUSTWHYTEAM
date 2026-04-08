DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tasks',
    'chat_messages',
    'announcements',
    'notifications',
    'activity_logs',
    'project_members'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'Added % to supabase_realtime', t;
    ELSE
      RAISE NOTICE '% already in supabase_realtime, skipping', t;
    END IF;
  END LOOP;
END $$;
