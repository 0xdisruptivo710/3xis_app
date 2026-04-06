import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

const awardXPSchema = z.object({
  amount: z.number().int().positive('XP amount must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
  sourceType: z.enum([
    'checklist',
    'video',
    'sales_log',
    'daily_goal',
    'weekly_goal',
    'ritual',
    'streak',
    'mission',
    'manual',
  ]),
  sourceId: z.string().min(1, 'Source ID is required'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = awardXPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, reason, sourceType, sourceId } = parsed.data;

    // Insert XP transaction (idempotent via UNIQUE constraint)
    const { data: transaction, error: txError } = await supabase
      .from('x3_xp_transactions')
      .insert({
        user_id: user.id,
        amount,
        reason,
        source_type: sourceType,
        source_id: sourceId,
      })
      .select()
      .single();

    if (txError) {
      // Duplicate key = already awarded for this source — return success with no-op
      if (txError.code === '23505') {
        return NextResponse.json({
          data: null,
          message: 'XP already awarded for this action. No duplicate XP granted.',
          alreadyAwarded: true,
        });
      }
      throw new Error(`Failed to insert XP transaction: ${txError.message}`);
    }

    // Fetch current profile to calculate new totals
    const { data: profile, error: profileError } = await supabase
      .from('x3_profiles')
      .select('xp_total, current_level')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    const newTotalXP = profile.xp_total + amount;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > profile.current_level;

    // Update profile with new XP total and level
    const { error: updateError } = await supabase
      .from('x3_profiles')
      .update({
        xp_total: newTotalXP,
        current_level: newLevel,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update profile XP: ${updateError.message}`);
    }

    return NextResponse.json({
      data: {
        transaction,
        xpTotal: newTotalXP,
        currentLevel: newLevel,
        leveledUp,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/game/xp error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
