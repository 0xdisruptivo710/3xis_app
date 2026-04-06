import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const salesActivitySchema = z.object({
  activityDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  callsMade: z.number().int().min(0).default(0),
  contactsReached: z.number().int().min(0).default(0),
  appointmentsSet: z.number().int().min(0).default(0),
  testDrives: z.number().int().min(0).default(0),
  proposalsSent: z.number().int().min(0).default(0),
  salesClosed: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('x3_sales_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('activity_date', { ascending: false });

    if (startDate) {
      query = query.gte('activity_date', startDate);
    }
    if (endDate) {
      query = query.lte('activity_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sales activities: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/sales error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const parsed = salesActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      activityDate,
      callsMade,
      contactsReached,
      appointmentsSet,
      testDrives,
      proposalsSent,
      salesClosed,
      notes,
    } = parsed.data;

    // Upsert on (user_id, activity_date)
    const { data, error } = await supabase
      .from('x3_sales_activities')
      .upsert(
        {
          user_id: user.id,
          activity_date: activityDate,
          calls_made: callsMade,
          contacts_reached: contactsReached,
          appointments_set: appointmentsSet,
          test_drives: testDrives,
          proposals_sent: proposalsSent,
          sales_closed: salesClosed,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,activity_date' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert sales activity: ${error.message}`);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/sales error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
