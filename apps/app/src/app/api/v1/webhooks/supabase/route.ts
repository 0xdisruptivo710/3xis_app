import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 501 },
  { level: 3, xpRequired: 1501 },
  { level: 4, xpRequired: 3001 },
  { level: 5, xpRequired: 5001 },
  { level: 6, xpRequired: 8001 },
];

function calculateLevel(totalXP: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
}

export async function POST(request: Request) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { type, table, record } = payload;

    // Handle INSERT on xp_transactions -> check level advancement
    if (type === 'INSERT' && table === 'x3_xp_transactions') {
      const supabase = await createAdminClient();
      const userId = record.user_id;

      // Fetch user's current profile
      const { data: profile, error: profileError } = await supabase
        .from('x3_profiles')
        .select('xp_total, current_level')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error(
          `Webhook: Failed to fetch profile for user ${userId}:`,
          profileError?.message
        );
        return NextResponse.json(
          { error: 'Failed to fetch user profile' },
          { status: 500 }
        );
      }

      const newLevel = calculateLevel(profile.xp_total);

      if (newLevel !== profile.current_level) {
        const { error: updateError } = await supabase
          .from('x3_profiles')
          .update({ current_level: newLevel })
          .eq('id', userId);

        if (updateError) {
          console.error(
            `Webhook: Failed to update level for user ${userId}:`,
            updateError.message
          );
          return NextResponse.json(
            { error: 'Failed to update user level' },
            { status: 500 }
          );
        }

        console.log(
          `Webhook: User ${userId} advanced from level ${profile.current_level} to level ${newLevel}`
        );
      }

      return NextResponse.json({
        success: true,
        message: `XP transaction processed for user ${userId}. Level: ${newLevel}.`,
      });
    }

    // Unhandled event type — acknowledge receipt
    return NextResponse.json({
      success: true,
      message: `Event type "${type}" on table "${table}" acknowledged but not handled.`,
    });
  } catch (error) {
    console.error('Webhook /api/v1/webhooks/supabase error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
