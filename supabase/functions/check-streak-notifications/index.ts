import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find users who haven't added learning today
    const { data: usersWithStreaks, error: streakError } = await supabase
      .from('learning_streaks')
      .select('user_id')
      .eq('date', today);

    if (streakError) {
      console.error('Error fetching streaks:', streakError);
      throw streakError;
    }

    const usersWithLearningToday = new Set(usersWithStreaks?.map(s => s.user_id) || []);

    // Get all push subscriptions for users who haven't learned today
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    const usersToNotify = subscriptions?.filter(
      sub => !usersWithLearningToday.has(sub.user_id)
    ) || [];

    console.log(`Found ${usersToNotify.length} users to notify`);

    // In a real implementation, you would send push notifications here
    // using Web Push protocol with the subscription details

    return new Response(JSON.stringify({ 
      success: true, 
      notifiedUsers: usersToNotify.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Notification check error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
