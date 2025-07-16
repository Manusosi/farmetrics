export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      farmers: {
        Row: {
          created_at: string
          district: string
          id: string
          location: string | null
          name: string
          phone_number: string | null
          region: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          location?: string | null
          name: string
          phone_number?: string | null
          region: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          location?: string | null
          name?: string
          phone_number?: string | null
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          assigned_officer_id: string | null
          created_at: string
          crop_type: string
          district: string
          farm_name: string
          farmer_id: string
          id: string
          is_approved: boolean
          last_visit_date: string | null
          location: string | null
          polygon_coordinates: Json | null
          region: string
          total_area: number | null
          updated_at: string
          visit_count: number
        }
        Insert: {
          assigned_officer_id?: string | null
          created_at?: string
          crop_type: string
          district: string
          farm_name: string
          farmer_id: string
          id?: string
          is_approved?: boolean
          last_visit_date?: string | null
          location?: string | null
          polygon_coordinates?: Json | null
          region: string
          total_area?: number | null
          updated_at?: string
          visit_count?: number
        }
        Update: {
          assigned_officer_id?: string | null
          created_at?: string
          crop_type?: string
          district?: string
          farm_name?: string
          farmer_id?: string
          id?: string
          is_approved?: boolean
          last_visit_date?: string | null
          location?: string | null
          polygon_coordinates?: Json | null
          region?: string
          total_area?: number | null
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "farms_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          farm_id: string
          id: string
          priority: string
          reported_by: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          farm_id: string
          id?: string
          priority?: string
          reported_by: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          farm_id?: string
          id?: string
          priority?: string
          reported_by?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          full_name: string
          id: string
          is_active: boolean
          location: string | null
          phone_number: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          location?: string | null
          phone_number?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          location?: string | null
          phone_number?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          admin_comment: string | null
          created_at: string
          from_supervisor: string
          id: string
          officer_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          status: string
          to_supervisor: string | null
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          from_supervisor: string
          id?: string
          officer_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          status?: string
          to_supervisor?: string | null
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          from_supervisor?: string
          id?: string
          officer_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          status?: string
          to_supervisor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_supervisor_fkey"
            columns: ["from_supervisor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_supervisor_fkey"
            columns: ["to_supervisor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_images: {
        Row: {
          coordinates: Json | null
          created_at: string
          exif_data: Json | null
          id: string
          image_url: string
          visit_id: string
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          exif_data?: Json | null
          id?: string
          image_url: string
          visit_id: string
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          exif_data?: Json | null
          id?: string
          image_url?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_images_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          coordinates: Json | null
          created_at: string
          farm_id: string
          id: string
          is_approved: boolean
          notes: string | null
          officer_id: string
          visit_date: string
          visit_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          coordinates?: Json | null
          created_at?: string
          farm_id: string
          id?: string
          is_approved?: boolean
          notes?: string | null
          officer_id: string
          visit_date?: string
          visit_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          coordinates?: Json | null
          created_at?: string
          farm_id?: string
          id?: string
          is_approved?: boolean
          notes?: string | null
          officer_id?: string
          visit_date?: string
          visit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "visits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_role: "admin" | "supervisor" | "field_officer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "supervisor", "field_officer"],
    },
  },
} as const
