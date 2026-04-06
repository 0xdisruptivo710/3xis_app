import { SupabaseClient } from '@supabase/supabase-js';
import { ISalesRepository, CreateSalesActivityData, SalesActivity } from '@3x/domain';
import { Database } from '../supabase/types';

type SalesRow = Database['public']['Tables']['x3_sales_activities']['Row'];

function mapRowToActivity(row: SalesRow): SalesActivity {
  return new SalesActivity({
    id: row.id,
    userId: row.user_id,
    activityDate: row.activity_date,
    callsMade: row.calls_made,
    contactsReached: row.contacts_reached,
    appointmentsSet: row.appointments_set,
    testDrives: row.test_drives,
    proposalsSent: row.proposals_sent,
    salesClosed: row.sales_closed,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SupabaseSalesRepository implements ISalesRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findByUserAndDate(userId: string, date: string): Promise<SalesActivity | null> {
    const { data, error } = await this.client
      .from('x3_sales_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', date)
      .single();

    if (error || !data) return null;
    return mapRowToActivity(data);
  }

  async findByUserAndPeriod(userId: string, startDate: string, endDate: string): Promise<SalesActivity[]> {
    const { data, error } = await this.client
      .from('x3_sales_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)
      .order('activity_date', { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToActivity);
  }

  async upsert(data: CreateSalesActivityData): Promise<SalesActivity> {
    const { data: row, error } = await this.client
      .from('x3_sales_activities')
      .upsert({
        user_id: data.userId,
        activity_date: data.activityDate,
        calls_made: data.callsMade,
        contacts_reached: data.contactsReached,
        appointments_set: data.appointmentsSet,
        test_drives: data.testDrives,
        proposals_sent: data.proposalsSent,
        sales_closed: data.salesClosed,
        notes: data.notes ?? null,
      }, { onConflict: 'user_id,activity_date' })
      .select()
      .single();

    if (error || !row) throw new Error(`Failed to upsert sales activity: ${error?.message}`);
    return mapRowToActivity(row);
  }
}
