export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      packs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          number_prompts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          number_prompts?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          number_prompts?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          id: string
          pack_id: string
          user_id: string
          title: string | null
          content: string
          rating: number | null
          created_at: string
          updated_at: string
          number_versions: number
        }
        Insert: {
          id?: string
          pack_id: string
          user_id: string
          title?: string | null
          content: string
          rating?: number | null
          created_at?: string
          updated_at?: string
          number_versions?: number
        }
        Update: {
          id?: string
          pack_id?: string
          user_id?: string
          title?: string | null
          content?: string
          rating?: number | null
          created_at?: string
          updated_at?: string
          number_versions?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          content: string
          rating: number | null
          is_accepted: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          content: string
          rating?: number | null
          is_accepted?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          content?: string
          rating?: number | null
          is_accepted?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          username: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Pack = Database['public']['Tables']['packs']['Row']
export type Prompt = Database['public']['Tables']['prompts']['Row']
export type PromptVersion = Database['public']['Tables']['prompt_versions']['Row']
export type UserProfile = Database['public']['Tables']['users']['Row']
