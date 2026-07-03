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
  member_a: string | null;
  member_b: string | null;
  invite_code: string;
  status: 'pending' | 'active' | 'dissolved';
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
  couple_id: string | null;
  // 0029: 'classic' | 'gratitude' | 'are' | 'self_expansion' — a serving
  // concern (reinforcement cadence); the play flow renders all kinds the same.
  kind: string;
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
  wave_pct: number | null;
  caught_up: boolean;
  created_at: string;
}

export interface TodayState {
  exists: boolean;
  date: string;
  couple_drop_id?: string;
  state?: 'open' | 'one_done' | 'revealed';
  wave_pct?: number | null;
  i_answered?: boolean;
  partner_answered?: boolean;
  held?: boolean;
  // 0021: yesterday's drop is still answerable today (scored at 80%).
  catch_up_available?: boolean;
  yesterday_state?: 'open' | 'one_done' | 'revealed' | null;
}

// get_streak_surface (0017): the honest streak screen in one round-trip.
// week = last 7 couple-local days, OLDEST FIRST (week[6] is today); true when
// that day's couple_drop reached state 'revealed'.
export interface StreakSurface {
  streak: number;
  longest_streak: number;
  freezes_remaining: number;
  week: boolean[];
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

// 0027: post-reveal "did this bring you closer?" — the author's own signal
// (RLS: author-only SELECT; the partner never sees it). Writes via record_closeness.
export interface ClosenessFeedback {
  id: string;
  couple_id: string;
  couple_drop_id: string;
  author: string;
  closer: boolean;
  created_at: string;
}

// 0018: per-prompt emoji reaction on a revealed drop (one per author per prompt).
export interface Reaction {
  id: string;
  couple_drop_id: string;
  prompt_id: string;
  author: string;
  emoji: string;
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

// 0020: a two-sided Refocus session. Writes go through the DEFINER RPCs
// (start_refocus / add_refocus_side); ai_result is written by the refocus
// edge function with the service role once both sides are in.
export interface RefocusSession {
  id: string;
  couple_id: string;
  initiator: string;
  topic: string;
  initiator_side: string;
  partner_side: string | null;
  state: 'waiting_partner' | 'ready' | 'revealed' | 'expired';
  ai_result: Json | null;
  created_at: string;
  partner_joined_at: string | null;
  revealed_at: string | null;
}

// 0029: a Money Date — the guided money conversation, done together on one
// phone. Writes go through the DEFINER RPCs (start_money_date /
// advance_money_date / complete_money_date); card copy lives in the client.
export interface MoneyDateSession {
  id: string;
  couple_id: string;
  started_by: string;
  step: number;
  responses: Json;
  agreed_action: string | null;
  state: 'open' | 'completed' | 'abandoned';
  created_at: string;
  completed_at: string | null;
}

// get_money_date_state (0029): the Us row + session screen in one round trip.
export interface MoneyDateState {
  open: { id: string; step: number; started_by: string } | null;
  last_completed_at: string | null;
  last_agreed_action: string | null;
  sessions_completed: number;
}

export interface CoupleHistoryRow {
  // 0024: real id so detail views render the actual drop; wavelength is the
  // STORED server score (a caught-up round's 80% holds everywhere).
  couple_drop_id: string;
  date: string;
  code: string;
  title: string;
  wavelength: number;
  twins_count: number;
  caught_up: boolean;
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
      reactions: {
        Row: Reaction;
        Insert: Omit<Reaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Reaction, 'id' | 'created_at'>>;
      };
      closeness_feedback: {
        Row: ClosenessFeedback;
        Insert: Omit<ClosenessFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<ClosenessFeedback, 'id' | 'created_at'>>;
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
      refocus_sessions: {
        Row: RefocusSession;
        Insert: Omit<RefocusSession, 'id' | 'created_at'>;
        Update: Partial<Omit<RefocusSession, 'id' | 'created_at'>>;
      };
      money_date_sessions: {
        Row: MoneyDateSession;
        Insert: Omit<MoneyDateSession, 'id' | 'created_at'>;
        Update: Partial<Omit<MoneyDateSession, 'id' | 'created_at'>>;
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
      ensure_yesterday_drop: {
        Args: { p_couple: string };
        Returns: string;
      };
      regenerate_invite: {
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
      get_today_state: {
        Args: { p_couple: string };
        Returns: Json;
      };
      get_streak_surface: {
        Args: { p_couple: string };
        Returns: Json;
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
      start_refocus: {
        Args: {
          p_couple: string;
          p_topic: string;
          p_side: string;
        };
        Returns: string;
      };
      add_refocus_side: {
        Args: {
          p_session: string;
          p_side: string;
        };
        Returns: void;
      };
      send_pack: {
        Args: {
          p_couple: string;
          p_theme: string;
        };
        Returns: void;
      };
      repair_streak: {
        Args: { p_couple: string };
        Returns: Json;
      };
      record_closeness: {
        Args: {
          p_couple_drop: string;
          p_closer: boolean;
        };
        Returns: void;
      };
      unpair: {
        Args: { p_couple: string };
        Returns: void;
      };
      delete_my_account: {
        Args: object;
        Returns: void;
      };
      start_money_date: {
        Args: { p_couple: string };
        Returns: string;
      };
      get_money_date_state: {
        Args: { p_couple: string };
        Returns: Json;
      };
      advance_money_date: {
        Args: {
          p_session: string;
          p_note?: string | null;
        };
        Returns: number;
      };
      complete_money_date: {
        Args: {
          p_session: string;
          p_action: string;
        };
        Returns: void;
      };
    };
  };
}
