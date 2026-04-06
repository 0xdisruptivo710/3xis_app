import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid URL'),
  p256dhKey: z.string().min(1, 'p256dh key is required'),
  authKey: z.string().min(1, 'Auth key is required'),
  userAgent: z.string().optional(),
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
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { endpoint, p256dhKey, authKey, userAgent } = parsed.data;

    // Upsert on endpoint (a user may re-subscribe from the same browser)
    const { data, error } = await supabase
      .from('x3_push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh_key: p256dhKey,
          auth_key: authKey,
          user_agent: userAgent ?? null,
        },
        { onConflict: 'endpoint' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save push subscription: ${error.message}`);
    }

    return NextResponse.json(
      { data, message: 'Push subscription registered successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/notifications/subscribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
