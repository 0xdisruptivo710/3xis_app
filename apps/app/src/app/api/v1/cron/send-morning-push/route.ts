import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();

    // Fetch users who have morning ritual push enabled
    const { data: preferences, error: prefsError } = await supabase
      .from('x3_notification_preferences')
      .select('user_id')
      .eq('morning_ritual', true);

    if (prefsError) {
      throw new Error(`Failed to fetch preferences: ${prefsError.message}`);
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with morning push enabled. Skipping.',
      });
    }

    const userIds = preferences.map((p) => p.user_id);

    // Fetch push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from('x3_push_subscriptions')
      .select('user_id, endpoint, p256dh_key, auth_key')
      .in('user_id', userIds);

    if (subsError) {
      throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No push subscriptions found for eligible users.',
      });
    }

    // TODO: Implement actual Web Push sending with the web-push library.
    // For now, log the notifications that would be sent.
    //
    // Each subscription would receive a payload like:
    // {
    //   title: "Bom dia! Hora do ritual matinal",
    //   body: "Comece seu dia com energia. Seus rituais te esperam!",
    //   icon: "/icons/icon-192x192.png",
    //   badge: "/icons/icon-96x96.png",
    //   data: { url: "/rituals" }
    // }

    let sentCount = 0;

    for (const sub of subscriptions) {
      console.log(
        `[Morning Push] Would send notification to user ${sub.user_id} at endpoint ${sub.endpoint.substring(0, 50)}...`
      );
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Morning push complete. Notifications queued: ${sentCount}.`,
    });
  } catch (error) {
    console.error('Cron send-morning-push error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
