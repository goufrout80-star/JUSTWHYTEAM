import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return respond({ error: 'Missing authorization header' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify calling user with their own token (uses anon key + JWT)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) return respond({ error: 'Unauthorized' }, 401);

    // Check caller is super admin
    const { data: profile } = await callerClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) return respond({ error: 'Forbidden — admin only' }, 403);

    // Parse body
    let userId: string;
    try {
      const body = await req.json();
      userId = body.userId;
    } catch {
      return respond({ error: 'Invalid JSON body' }, 400);
    }

    if (!userId) return respond({ error: 'userId is required' }, 400);
    if (userId === user.id) return respond({ error: 'Cannot delete your own account' }, 400);

    // Delete with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) return respond({ error: deleteError.message }, 400);

    return respond({ success: true });

  } catch (err) {
    console.error('[delete-user]', err);
    return respond({ error: 'Internal server error' }, 500);
  }
});
