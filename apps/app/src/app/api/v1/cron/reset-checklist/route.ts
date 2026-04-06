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
    const today = new Date().toISOString().split('T')[0];

    // Fetch all active users with their store_id
    const { data: users, error: usersError } = await supabase
      .from('x3_profiles')
      .select('id, store_id')
      .not('store_id', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users found. Skipping checklist reset.',
      });
    }

    // Collect unique store IDs to fetch templates
    const storeIds = [...new Set(users.map((u) => u.store_id).filter(Boolean))];

    // Fetch checklist templates for each store (prefer store-specific, fallback to default)
    const { data: templates, error: templatesError } = await supabase
      .from('x3_checklist_templates')
      .select('id, store_id, is_default')
      .or(`store_id.in.(${storeIds.join(',')}),is_default.eq.true`);

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    // Build a map: store_id -> template_id (store-specific takes priority over default)
    const defaultTemplate = templates?.find((t) => t.is_default);
    const storeTemplateMap = new Map<string, string>();

    for (const t of templates ?? []) {
      if (t.store_id) {
        storeTemplateMap.set(t.store_id, t.id);
      }
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const templateId =
        storeTemplateMap.get(user.store_id) ?? defaultTemplate?.id;

      if (!templateId) {
        skippedCount++;
        continue;
      }

      // Check if checklist already exists for today (idempotency)
      const { data: existing } = await supabase
        .from('x3_daily_checklists')
        .select('id')
        .eq('user_id', user.id)
        .eq('checklist_date', today)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      // Create daily checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('x3_daily_checklists')
        .insert({ user_id: user.id, checklist_date: today })
        .select('id')
        .single();

      if (checklistError) {
        console.error(
          `Failed to create checklist for user ${user.id}:`,
          checklistError.message
        );
        continue;
      }

      // Fetch template items
      const { data: templateItems } = await supabase
        .from('x3_checklist_template_items')
        .select('label, xp_reward, sort_order')
        .eq('template_id', templateId)
        .order('sort_order');

      if (templateItems && templateItems.length > 0) {
        const itemsToInsert = templateItems.map((item) => ({
          checklist_id: checklist.id,
          label: item.label,
          xp_reward: item.xp_reward,
          sort_order: item.sort_order,
          is_custom: false,
        }));

        const { error: itemsError } = await supabase
          .from('x3_daily_checklist_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error(
            `Failed to create checklist items for user ${user.id}:`,
            itemsError.message
          );
        }
      }

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Checklist reset complete. Created: ${createdCount}, Skipped: ${skippedCount}.`,
    });
  } catch (error) {
    console.error('Cron reset-checklist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
