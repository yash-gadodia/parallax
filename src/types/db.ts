export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  intents: string[];
  spice_level: string;
  notify_time: string | null;
  notify_tz: string | null;
  push_token: string | null;
  created_at: string;
}

export interface Couple {
  id: string;
  member_a: string;
  member_b: string | null;
  invite_code: string;
  status: 'pending' | 'active';
  together_since: string | null;
  streak: number;
  longest_streak: number;
  freezes_remaining: number;
  last_played_on: string | null;
  wavelength_avg: number | null;
  plus: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      couples: {
        Row: Couple;
        Insert: Omit<Couple, 'id' | 'created_at'>;
        Update: Partial<Omit<Couple, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      create_couple: {
        Args: Record<string, string> | {};
        Returns: Couple;
      };
      join_couple: {
        Args: Record<string, string> | {};
        Returns: Couple;
      };
    };
  };
}
