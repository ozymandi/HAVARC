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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          emailed_at: string | null
          error: string | null
          id: string
          job_id: string
          kind: Database["public"]["Enums"]["document_kind"]
          size_bytes: number | null
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emailed_at?: string | null
          error?: string | null
          id?: string
          job_id: string
          kind: Database["public"]["Enums"]["document_kind"]
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emailed_at?: string | null
          error?: string | null
          id?: string
          job_id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          equipment_id: string | null
          filter_size: string | null
          id: string
          job_id: string
          location: string | null
          manufacturer: string | null
          model: string | null
          position: number
          refrigerant: string | null
          serial: string | null
          tonnage: string | null
          type: string | null
          voltage: string | null
        }
        Insert: {
          equipment_id?: string | null
          filter_size?: string | null
          id?: string
          job_id: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          position?: number
          refrigerant?: string | null
          serial?: string | null
          tonnage?: string | null
          type?: string | null
          voltage?: string | null
        }
        Update: {
          equipment_id?: string | null
          filter_size?: string | null
          id?: string
          job_id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          position?: number
          refrigerant?: string | null
          serial?: string | null
          tonnage?: string | null
          type?: string | null
          voltage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          customer_paid: boolean
          description: string
          id: string
          job_id: string
          position: number
          qty: number
          unit_price: number
        }
        Insert: {
          customer_paid?: boolean
          description: string
          id?: string
          job_id: string
          position?: number
          qty?: number
          unit_price?: number
        }
        Update: {
          customer_paid?: boolean
          description?: string
          id?: string
          job_id?: string
          position?: number
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["job_id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          description: string | null
          discount: number
          job_id: string
          number: string | null
          tax_rate: number
          updated_at: string
          work_performed: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount?: number
          job_id: string
          number?: string | null
          tax_rate?: number
          updated_at?: string
          work_performed?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          discount?: number
          job_id?: string
          number?: string | null
          tax_rate?: number
          updated_at?: string
          work_performed?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_findings: {
        Row: {
          findings: string[]
          job_id: string
          parts: string | null
          recommendations: string[]
          recommended_work: string | null
          repairs: string[]
          service_notes: string | null
        }
        Insert: {
          findings?: string[]
          job_id: string
          parts?: string | null
          recommendations?: string[]
          recommended_work?: string | null
          repairs?: string[]
          service_notes?: string | null
        }
        Update: {
          findings?: string[]
          job_id?: string
          parts?: string | null
          recommendations?: string[]
          recommended_work?: string | null
          repairs?: string[]
          service_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_findings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          arrival_time: string | null
          complaint_details: string | null
          complaints: string[]
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          customer_notes: string | null
          customer_rep_name: string | null
          customer_signature_path: string | null
          departure_time: string | null
          final_status: Database["public"]["Enums"]["final_status"] | null
          id: string
          job_date: string
          service_type: string | null
          status: Database["public"]["Enums"]["job_status"]
          step: number
          technician: string
          technician_signature_path: string | null
          unit_suite: string | null
          updated_at: string
          work_order: string
        }
        Insert: {
          address?: string
          arrival_time?: string | null
          complaint_details?: string | null
          complaints?: string[]
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_rep_name?: string | null
          customer_signature_path?: string | null
          departure_time?: string | null
          final_status?: Database["public"]["Enums"]["final_status"] | null
          id?: string
          job_date?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          step?: number
          technician?: string
          technician_signature_path?: string | null
          unit_suite?: string | null
          updated_at?: string
          work_order: string
        }
        Update: {
          address?: string
          arrival_time?: string | null
          complaint_details?: string | null
          complaints?: string[]
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_rep_name?: string | null
          customer_signature_path?: string | null
          departure_time?: string | null
          final_status?: Database["public"]["Enums"]["final_status"] | null
          id?: string
          job_date?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          step?: number
          technician?: string
          technician_signature_path?: string | null
          unit_suite?: string | null
          updated_at?: string
          work_order?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string
          position: number
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          position?: number
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      readings: {
        Row: {
          blower_a: string | null
          cap_actual_mfd: string | null
          cap_rated_mfd: string | null
          compressor_a: string | null
          cond_fan_a: string | null
          drain_check: Database["public"]["Enums"]["check_state"] | null
          ductwork_check: Database["public"]["Enums"]["check_state"] | null
          filter_check: Database["public"]["Enums"]["check_state"] | null
          head_psig: string | null
          heating_check: Database["public"]["Enums"]["check_state"] | null
          incoming_v: string | null
          job_id: string
          outdoor_f: string | null
          refrigerant_added: string | null
          return_air: string | null
          return_static: string | null
          subcooling: string | null
          suction_psig: string | null
          superheat: string | null
          supply_air: string | null
          supply_static: string | null
          temp_split: string | null
          total_static: string | null
        }
        Insert: {
          blower_a?: string | null
          cap_actual_mfd?: string | null
          cap_rated_mfd?: string | null
          compressor_a?: string | null
          cond_fan_a?: string | null
          drain_check?: Database["public"]["Enums"]["check_state"] | null
          ductwork_check?: Database["public"]["Enums"]["check_state"] | null
          filter_check?: Database["public"]["Enums"]["check_state"] | null
          head_psig?: string | null
          heating_check?: Database["public"]["Enums"]["check_state"] | null
          incoming_v?: string | null
          job_id: string
          outdoor_f?: string | null
          refrigerant_added?: string | null
          return_air?: string | null
          return_static?: string | null
          subcooling?: string | null
          suction_psig?: string | null
          superheat?: string | null
          supply_air?: string | null
          supply_static?: string | null
          temp_split?: string | null
          total_static?: string | null
        }
        Update: {
          blower_a?: string | null
          cap_actual_mfd?: string | null
          cap_rated_mfd?: string | null
          compressor_a?: string | null
          cond_fan_a?: string | null
          drain_check?: Database["public"]["Enums"]["check_state"] | null
          ductwork_check?: Database["public"]["Enums"]["check_state"] | null
          filter_check?: Database["public"]["Enums"]["check_state"] | null
          head_psig?: string | null
          heating_check?: Database["public"]["Enums"]["check_state"] | null
          incoming_v?: string | null
          job_id?: string
          outdoor_f?: string | null
          refrigerant_added?: string | null
          return_air?: string | null
          return_static?: string | null
          subcooling?: string | null
          suction_psig?: string | null
          superheat?: string | null
          supply_air?: string | null
          supply_static?: string | null
          temp_split?: string | null
          total_static?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          company_name: string
          default_tax_rate: number
          email: string | null
          id: boolean
          invoice_footer: string | null
          invoice_prefix: string
          labor_rate: number
          logo_path: string | null
          next_invoice_number: number
          notify_email: string | null
          phone: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string
          default_tax_rate?: number
          email?: string | null
          id?: boolean
          invoice_footer?: string | null
          invoice_prefix?: string
          labor_rate?: number
          logo_path?: string | null
          next_invoice_number?: number
          notify_email?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          default_tax_rate?: number
          email?: string | null
          id?: boolean
          invoice_footer?: string | null
          invoice_prefix?: string
          labor_rate?: number
          logo_path?: string | null
          next_invoice_number?: number
          notify_email?: string | null
          phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      check_state: "good" | "issue"
      document_kind: "report" | "invoice"
      document_status: "pending" | "ready" | "error"
      final_status: "green" | "yellow" | "orange" | "red"
      job_status: "draft" | "pending" | "completed"
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
    Enums: {
      check_state: ["good", "issue"],
      document_kind: ["report", "invoice"],
      document_status: ["pending", "ready", "error"],
      final_status: ["green", "yellow", "orange", "red"],
      job_status: ["draft", "pending", "completed"],
    },
  },
} as const
