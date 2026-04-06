import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STREAK_MILESTONE = 7;
const STREAK_BONUS_XP = 200;

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

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Fetch all users with their streak info
    const { data: users, error: usersError } = await supabase
      .from('x3_profiles')
      .select('id, streak_days, last_active_date');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found. Skipping streak check.',
      });
    }

    let resetCount = 0;
    let incrementedCount = 0;
    let bonusCount = 0;

    for (const user of users) {
      const lastActive = user.last_active_date;

      if (!lastActive || lastActive < yesterdayStr) {
        // User was NOT active yesterday -> reset streak
        if (user.streak_days > 0) {
          const { error } = await supabase
            .from('x3_profiles')
            .update({ streak_days: 0 })
            .eq('id', user.id);

          if (error) {
            console.error(`Failed to reset streak for user ${user.id}:`, error.message);
          } else {
            resetCount++;
          }
        }
      } else if (lastActive === yesterdayStr) {
        // User was active yesterday -> increment streak
        const newStreak = user.streak_days + 1;

        const { error } = await supabase
          .from('x3_profiles')
          .update({ streak_days: newStreak })
          .eq('id', user.id);

        if (error) {
          console.error(`Failed to increment streak for user ${user.id}:`, error.message);
          continue;
        }

        incrementedCount++;

        // Award bonus XP at 7-day milestones (7, 14, 21, ...)
        if (newStreak > 0 && newStreak % STREAK_MILESTONE === 0) {
          const sourceId = `streak-${newStreak}-${yesterdayStr}`;

          const { error: xpError } = await supabase
            .from('x3_xp_transactions')
            .insert({
              user_id: user.id,
              amount: STREAK_BONUS_XP,
              reason: `Streak de ${newStreak} dias consecutivos!`,
              source_type: 'streak',
              source_id: sourceId,
            });

          // On conflict (idempotency) the insert is silently ignored
          if (xpError && !xpError.message.includes('duplicate')) {
            console.error(`Failed to award streak XP for user ${user.id}:`, xpError.message);
          } else if (!xpError) {
            // Update total XP on profile
            const { error: updateError } = await supabase.rpc('increment_xp', {
              user_id_input: user.id,
              amount_input: STREAK_BONUS_XP,
            });

            // Fallback if RPC doesn't exist: direct update
            if (updateError) {
              await supabase
                .from('x3_profiles')
                .update({ xp_total: (user as any).xp_total + STREAK_BONUS_XP })
                .eq('id', user.id);
            }

            bonusCount++;
          }
        }
      }
      // If lastActive is today, user is already active today — no action needed
    }

    return NextResponse.json({
      success: true,
      message: `Streak check complete. Reset: ${resetCount}, Incremented: ${incrementedCount}, Bonus XP awarded: ${bonusCount}.`,
    });
  } catch (error) {
    console.error('Cron check-streaks error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
