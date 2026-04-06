export interface Database {
  public: {
    Tables: {
      x3_profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: string;
          store_id: string | null;
          xp_total: number;
          current_level: number;
          streak_days: number;
          last_active_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: string;
          store_id?: string | null;
          xp_total?: number;
          current_level?: number;
          streak_days?: number;
          last_active_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['x3_profiles']['Insert']>;
      };
      x3_stores: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          state: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          city?: string | null;
          state?: string | null;
        };
        Update: Partial<Database['public']['Tables']['x3_stores']['Insert']>;
      };
      x3_sales_activities: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          calls_made: number;
          contacts_reached: number;
          appointments_set: number;
          test_drives: number;
          proposals_sent: number;
          sales_closed: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          activity_date?: string;
          calls_made?: number;
          contacts_reached?: number;
          appointments_set?: number;
          test_drives?: number;
          proposals_sent?: number;
          sales_closed?: number;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['x3_sales_activities']['Insert']>;
      };
      x3_daily_checklists: {
        Row: {
          id: string;
          user_id: string;
          checklist_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          checklist_date?: string;
          completed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['x3_daily_checklists']['Insert']>;
      };
      x3_daily_checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          label: string;
          is_completed: boolean;
          completed_at: string | null;
          is_custom: boolean;
          xp_reward: number;
          sort_order: number;
        };
        Insert: {
          checklist_id: string;
          label: string;
          is_completed?: boolean;
          is_custom?: boolean;
          xp_reward?: number;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['x3_daily_checklist_items']['Insert']>;
      };
      x3_rituals: {
        Row: {
          id: string;
          title: string;
          description: string;
          ritual_type: string;
          duration_min: number;
          benefit: string | null;
          icon: string;
          xp_reward: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          title: string;
          description: string;
          ritual_type: string;
          duration_min?: number;
          benefit?: string | null;
          icon?: string;
          xp_reward?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['x3_rituals']['Insert']>;
      };
      x3_user_daily_rituals: {
        Row: {
          id: string;
          user_id: string;
          ritual_id: string;
          ritual_date: string;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          ritual_id: string;
          ritual_date?: string;
        };
        Update: Partial<Database['public']['Tables']['x3_user_daily_rituals']['Insert']>;
      };
      x3_xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          source_type: string;
          source_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          reason: string;
          source_type: string;
          source_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['x3_xp_transactions']['Insert']>;
      };
      x3_user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
        };
        Update: Partial<Database['public']['Tables']['x3_user_badges']['Insert']>;
      };
      x3_badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_url: string;
          icon_locked_url: string;
          badge_type: string;
          created_at: string;
        };
        Insert: {
          name: string;
          description: string;
          icon_url: string;
          icon_locked_url: string;
          badge_type: string;
        };
        Update: Partial<Database['public']['Tables']['x3_badges']['Insert']>;
      };
      x3_game_levels: {
        Row: {
          id: number;
          level_number: number;
          name: string;
          xp_required: number;
          description: string | null;
          icon_url: string | null;
        };
        Insert: {
          level_number: number;
          name: string;
          xp_required: number;
          description?: string | null;
          icon_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['x3_game_levels']['Insert']>;
      };
    };
  };
}
