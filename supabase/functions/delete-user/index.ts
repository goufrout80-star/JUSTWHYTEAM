// Supabase Edge Function: delete-user
// Deletes a user from auth.users (requires service role + super admin caller)
// Deploy with: supabase functions deploy delete-user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify caller has a valid JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized — missing token' }, 401);
    }

    const callerToken = authHeader.replace('Bearer ', '');

    // Use service role admin client — can verify any JWT and bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's JWT
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(callerToken);
    if (authError || !caller) {
      return json({ error: 'Unauthorized — invalid token' }, 401);
    }

    // 2. Verify caller is super admin (use service role to bypass RLS)
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile?.is_super_admin) {
      return json({ error: 'Forbidden — super admin only' }, 403);
    }

    // 3. Parse and validate body
    let body: { userId?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { userId } = body;
    if (!userId || typeof userId !== 'string') {
      return json({ error: 'Missing or invalid userId' }, 400);
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return json({ error: 'Cannot delete your own account via admin panel' }, 400);
    }

    // 4. Use the same service role client to delete
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-user] Delete error:', deleteError);
      return json({ error: deleteError.message }, 400);
    }

    console.log(`[delete-user] User ${userId} deleted by admin ${caller.id}`);
    return json({ success: true, message: 'User deleted successfully' });

  } catch (err) {
    console.error('[delete-user] Unexpected error:', err);
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500);
  }
});
