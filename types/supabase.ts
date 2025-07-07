export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string | null;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      card_tags: {
        Row: {
          card_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          card_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          card_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
