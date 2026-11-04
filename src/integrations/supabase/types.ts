export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      capcut_drafts: {
        Row: {
          created_at: string
          duration: number
          id: string
          layers: Json
          name: string
          ratio: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          duration?: number
          id?: string
          layers?: Json
          name: string
          ratio: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          layers?: Json
          name?: string
          ratio?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          role: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      creations: {
        Row: {
          aspect: string
          client_id: number
          created_at: string
          error: string | null
          id: string
          kind: string
          model: string
          prompt: string
          status: string
          url: string | null
          user_id: string
        }
        Insert: {
          aspect?: string
          client_id: number
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          model: string
          prompt: string
          status?: string
          url?: string | null
          user_id: string
        }
        Update: {
          aspect?: string
          client_id?: number
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          model?: string
          prompt?: string
          status?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          description: string | null
          generation_id: string | null
          id: string
          purchase_id: string | null
          reason: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          purchase_id?: string | null
          reason?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          purchase_id?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance: number
          client_id: string
          lifetime_purchased: number
          lifetime_spent: number
          updated_at: string
        }
        Insert: {
          balance?: number
          client_id: string
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          client_id?: string
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      director_drafts: {
        Row: {
          action: string
          created_at: string
          id: string
          input: string
          model: string
          output: string
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          input: string
          model: string
          output: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          input?: string
          model?: string
          output?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          prompt: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          prompt?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          prompt?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          client_id: string
          created_at: string
          credits_used: number
          duration_ms: number | null
          error_message: string | null
          id: string
          modality: string | null
          model: string | null
          options: Json
          output_text: string | null
          output_url: string | null
          prompt: string | null
          provider: string | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          credits_used?: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          modality?: string | null
          model?: string | null
          options?: Json
          output_text?: string | null
          output_url?: string | null
          prompt?: string | null
          provider?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          credits_used?: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          modality?: string | null
          model?: string | null
          options?: Json
          output_text?: string | null
          output_url?: string | null
          prompt?: string | null
          provider?: string | null
          status?: string
        }
        Relationships: []
      }
      project_assets: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          project_id: string
          storage_path: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          project_id: string
          storage_path: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          project_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_renders: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          is_lip_sync: boolean
          is_omnihuman: boolean
          output_path: string | null
          project_id: string
          prompt: string | null
          provider: string | null
          provider_task_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_lip_sync?: boolean
          is_omnihuman?: boolean
          output_path?: string | null
          project_id: string
          prompt?: string | null
          provider?: string | null
          provider_task_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_lip_sync?: boolean
          is_omnihuman?: boolean
          output_path?: string | null
          project_id?: string
          prompt?: string | null
          provider?: string | null
          provider_task_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          enhanced_prompt: string | null
          error_message: string | null
          id: string
          output_path: string | null
          provider: string | null
          scene_prompt: string | null
          selected_model: string | null
          soul_id: string | null
          status: string
          style_prompt: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          output_path?: string | null
          provider?: string | null
          scene_prompt?: string | null
          selected_model?: string | null
          soul_id?: string | null
          status?: string
          style_prompt?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          output_path?: string | null
          provider?: string | null
          scene_prompt?: string | null
          selected_model?: string | null
          soul_id?: string | null
          status?: string
          style_prompt?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_packs: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid_minor: number | null
          client_id: string
          created_at: string
          credits_allocated: number | null
          currency: string | null
          id: string
          paystack_reference: string | null
          raw_event: Json | null
        }
        Insert: {
          amount_paid_minor?: number | null
          client_id: string
          created_at?: string
          credits_allocated?: number | null
          currency?: string | null
          id?: string
          paystack_reference?: string | null
          raw_event?: Json | null
        }
        Update: {
          amount_paid_minor?: number | null
          client_id?: string
          created_at?: string
          credits_allocated?: number | null
          currency?: string | null
          id?: string
          paystack_reference?: string | null
          raw_event?: Json | null
        }
        Relationships: []
      }
      souls: {
        Row: {
          cover_path: string | null
          created_at: string
          id: string
          identity_mode: string
          name: string
          reference_image_paths: string[]
          reference_profile: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          id?: string
          identity_mode?: string
          name: string
          reference_image_paths?: string[]
          reference_profile?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          id?: string
          identity_mode?: string
          name?: string
          reference_image_paths?: string[]
          reference_profile?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      storyboards: {
        Row: {
          concept: string
          created_at: string
          id: string
          reference_urls: Json
          shots: Json
          title: string
          user_id: string
        }
        Insert: {
          concept: string
          created_at?: string
          id?: string
          reference_urls?: Json
          shots?: Json
          title?: string
          user_id: string
        }
        Update: {
          concept?: string
          created_at?: string
          id?: string
          reference_urls?: Json
          shots?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_projects: {
        Row: {
          created_at: string
          id: string
          name: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_sessions: {
        Row: {
          id: string
          name: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id: string
          name: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_credits: {
        Args: {
          _amount: number
          _client_id: string
          _description: string
          _purchase_id: string
          _reason: string
        }
        Returns: undefined
      }
      spend_credits: {
        Args: {
          _amount: number
          _client_id: string
          _description: string
          _generation_id: string
          _reason: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
