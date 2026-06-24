export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          credits: number;
          is_admin: boolean;
          subscription_tier: "free" | "silver" | "gold" | "platinum";
          subscription_status: "free" | "active" | "past_due" | "cancelled";
          subscription_started_at: string | null;
          subscription_renews_at: string | null;
          memory_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          is_admin?: boolean;
          subscription_tier?: "free" | "silver" | "gold" | "platinum";
          subscription_status?: "free" | "active" | "past_due" | "cancelled";
          subscription_started_at?: string | null;
          subscription_renews_at?: string | null;
          memory_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users_profile"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          slug: string;
          name: string;
          age: number;
          gender: string;
          mode: string;
          category_id: string | null;
          short_description: string;
          backstory: string;
          relationship: string;
          scenario: string;
          occupation: string;
          image_prompt_key: string;
          localizations: Record<string, unknown>;
          personality: string;
          greeting: string;
          tags: string[];
          image_path: string;
          featured: boolean;
          visible: boolean;
          mood: string;
          credit_cost: number;
          created_by: string | null;
          portrait_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          age?: number;
          gender: string;
          mode: string;
          category_id?: string | null;
          short_description: string;
          backstory?: string;
          relationship?: string;
          scenario?: string;
          occupation?: string;
          image_prompt_key?: string;
          localizations?: Record<string, unknown>;
          personality: string;
          greeting: string;
          tags?: string[];
          image_path: string;
          featured?: boolean;
          visible?: boolean;
          mood?: string;
          credit_cost?: number;
          created_by?: string | null;
          portrait_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["characters"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          token_count: number;
          credit_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          token_count?: number;
          credit_cost?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_transactions"]["Insert"]>;
        Relationships: [];
      };
      payment_orders: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_order_id: string | null;
          status: string;
          amount_cents: number;
          credits: number;
          plan_id: string | null;
          subscription_tier: "free" | "silver" | "gold" | "platinum" | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          provider_order_id?: string | null;
          status: string;
          amount_cents: number;
          credits: number;
          plan_id?: string | null;
          subscription_tier?: "free" | "silver" | "gold" | "platinum" | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_orders"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
