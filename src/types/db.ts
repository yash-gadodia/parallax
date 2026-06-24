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

export interface Drop {
  id: string;
  code: string | null;
  title: string | null;
  theme: string | null;
  pack_id: string | null;
  created_at: string;
}

export interface DropPrompt {
  id: string;
  drop_id: string;
  position: number | null;
  emoji: string | null;
  question: string | null;
  options: string[];
  created_at: string;
}

export interface CoupleDrop {
  id: string;
  couple_id: string;
  drop_id: string;
  date: string;
  state: 'open' | 'one_done' | 'revealed';
  created_at: string;
}

export interface Answer {
  id: string;
  couple_drop_id: string;
  prompt_id: string;
  author: string;
  pick: number | null;
  hunch: number | null;
  created_at: string;
}

export interface Activity {
  id: string;
  couple_id: string;
  kind: string;
  actor: string | null;
  payload: Json;
  read_by: string[];
  created_at: string;
}

export interface Learning {
  id: string;
  couple_id: string;
  about: string;
  emoji: string | null;
  need: string | null;
  detail: string | null;
  source: 'drop' | 'refocus';
  origin: string | null;
  mastery: number;
  became_prompt_id: string | null;
  // The daily-drop question this learning turned into, when available (display only).
  became_question?: string | null;
  created_at: string;
}

export interface CoupleHistoryRow {
  date: string;
  code: string;
  title: string;
  wavelength: number;
  twins_count: number;
}

export type Json = unknown;

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
      drops: {
        Row: Drop;
        Insert: Omit<Drop, 'id' | 'created_at'>;
        Update: Partial<Omit<Drop, 'id' | 'created_at'>>;
      };
      drop_prompts: {
        Row: DropPrompt;
        Insert: Omit<DropPrompt, 'id' | 'created_at'>;
        Update: Partial<Omit<DropPrompt, 'id' | 'created_at'>>;
      };
      couple_drops: {
        Row: CoupleDrop;
        Insert: Omit<CoupleDrop, 'id' | 'created_at'>;
        Update: Partial<Omit<CoupleDrop, 'id' | 'created_at'>>;
      };
      answers: {
        Row: Answer;
        Insert: Omit<Answer, 'id' | 'created_at'>;
        Update: Partial<Omit<Answer, 'id' | 'created_at'>>;
      };
      activity: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
      learnings: {
        Row: Learning;
        Insert: Omit<Learning, 'id' | 'created_at'>;
        Update: Partial<Omit<Learning, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      create_couple: {
        Args: object;
        Returns: Couple;
      };
      join_couple: {
        Args: { p_code: string };
        Returns: Couple;
      };
      ensure_today_drop: {
        Args: { p_couple: string };
        Returns: string;
      };
      submit_answers: {
        Args: {
          p_couple_drop: string;
          p_answers: Json;
        };
        Returns: Json;
      };
      sim_partner_submit: {
        Args: { p_couple_drop: string };
        Returns: void;
      };
      log_activity: {
        Args: {
          p_couple: string;
          p_kind: string;
          p_payload?: Json;
        };
        Returns: string;
      };
      mark_activity_read: {
        Args: { p_couple: string };
        Returns: void;
      };
      nudge_partner: {
        Args: { p_couple: string };
        Returns: string;
      };
      complete_streak: {
        Args: { p_couple_drop: string };
        Returns: void;
      };
      add_learning: {
        Args: {
          p_couple: string;
          p_about: string;
          p_emoji: string;
          p_need: string;
          p_detail: string;
          p_source: string;
          p_origin: string;
        };
        Returns: string;
      };
      couple_history: {
        Args: { p_couple: string };
        Returns: CoupleHistoryRow[];
      };
      unpair: {
        Args: { p_couple: string };
        Returns: void;
      };
    };
  };
}
