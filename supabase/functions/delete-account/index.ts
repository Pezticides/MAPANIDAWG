import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(
  status: number,
  body: Record<string, boolean | string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const authorization = request.headers.get('Authorization') ?? '';
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!bearerMatch) {
    return jsonResponse(401, { error: 'Sign in before deleting your account.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('Account deletion function is missing Supabase server configuration.');
    return jsonResponse(500, {
      error: 'Account deletion is not configured on the server.',
    });
  }

  try {
    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data: userData, error: userError } =
      await userClient.auth.getUser(bearerMatch[1]);

    if (userError || !userData.user) {
      return jsonResponse(401, {
        error: 'Your sign-in session is invalid. Sign in again and retry.',
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const userId = userData.user.id;

    const { error: savedLocationsError } = await adminClient
      .from('saved_locations')
      .delete()
      .eq('user_id', userId);
    if (savedLocationsError) {
      console.error(
        'Could not delete account saved locations:',
        savedLocationsError.message
      );
      return jsonResponse(500, {
        error:
          'Could not remove saved places. Account deletion was not completed; retry or contact support.',
      });
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.error('Could not delete account profile:', profileError.message);
      return jsonResponse(500, {
        error:
          'Could not remove the profile. Account deletion was not completed; retry or contact support.',
      });
    }

    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error(
        'Could not delete Supabase Auth user:',
        deleteUserError.message
      );
      return jsonResponse(500, {
        error:
          'Could not remove the Supabase account. Some saved data may already have been deleted; retry or contact support.',
      });
    }

    return jsonResponse(200, { deleted: true });
  } catch (error) {
    console.error(
      'Unexpected account deletion failure:',
      error instanceof Error ? error.message : 'Unknown server error.'
    );
    return jsonResponse(500, {
      error: 'An unexpected error prevented account deletion. Please retry.',
    });
  }
});
