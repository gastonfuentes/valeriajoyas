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
      addresses: {
        Row: {
          apartment: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          notes: string | null
          phone: string | null
          postal_code: string
          province: string
          recipient_name: string
          street: string
          street_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment?: string | null
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          notes?: string | null
          phone?: string | null
          postal_code: string
          province: string
          recipient_name: string
          street: string
          street_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string
          province?: string
          recipient_name?: string
          street?: string
          street_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          session_token: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_token?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_token?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          tool_calls: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          tool_calls?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["chat_role"]
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_order: number
          redeemed_count: number
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order?: number
          redeemed_count?: number
          starts_at?: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order?: number
          redeemed_count?: number
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          low_stock_threshold: number
          quantity: number
          reserved: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          low_stock_threshold?: number
          quantity?: number
          reserved?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          low_stock_threshold?: number
          quantity?: number
          reserved?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_name: string
          quantity: number
          sku?: string | null
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          discount_total: number
          email: string
          id: string
          notes: string | null
          order_number: number
          phone: string | null
          pickup: boolean
          shipping_address: Json | null
          shipping_method: string | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_total?: number
          email: string
          id?: string
          notes?: string | null
          order_number?: number
          phone?: string | null
          pickup?: boolean
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_total?: number
          email?: string
          id?: string
          notes?: string | null
          order_number?: number
          phone?: string | null
          pickup?: boolean
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_id: string | null
          id: string
          order_id: string
          preference_id: string | null
          provider: string
          raw: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          status_detail: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          order_id: string
          preference_id?: string | null
          provider?: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_detail?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          order_id?: string
          preference_id?: string | null
          provider?: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_detail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          storage_path: string
          variant_id: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          storage_path: string
          variant_id?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          storage_path?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string | null
          position: number
          price: number | null
          product_id: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          position?: number
          price?: number | null
          product_id: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          position?: number
          price?: number | null
          product_id?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_featured: boolean
          material: string | null
          name: string
          slug: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          base_price: number
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          material?: string | null
          name: string
          slug: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          material?: string | null
          name?: string
          slug?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          cost: number
          created_at: string
          currency: string
          destination_postal_code: string | null
          estimated_days: number | null
          id: string
          label_url: string | null
          order_id: string
          provider: string
          raw: Json | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          currency?: string
          destination_postal_code?: string | null
          estimated_days?: number | null
          id?: string
          label_url?: string | null
          order_id: string
          provider: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          currency?: string
          destination_postal_code?: string | null
          estimated_days?: number | null
          id?: string
          label_url?: string | null
          order_id?: string
          provider?: string
          raw?: Json | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          currency: string
          free_shipping_threshold: number | null
          id: number
          origin_address: Json | null
          origin_postal_code: string | null
          pickup_enabled: boolean
          social: Json
          store_name: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          free_shipping_threshold?: number | null
          id?: number
          origin_address?: Json | null
          origin_postal_code?: string | null
          pickup_enabled?: boolean
          social?: Json
          store_name?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          free_shipping_threshold?: number | null
          id?: number
          origin_address?: Json | null
          origin_postal_code?: string | null
          pickup_enabled?: boolean
          social?: Json
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      chat_role: "user" | "assistant" | "system" | "tool"
      coupon_type: "percent" | "fixed"
      order_status:
        | "pending"
        | "paid"
        | "fulfilled"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status:
        | "pending"
        | "in_process"
        | "approved"
        | "rejected"
        | "refunded"
        | "cancelled"
        | "charged_back"
      shipment_status:
        | "pending"
        | "ready"
        | "in_transit"
        | "delivered"
        | "returned"
        | "cancelled"
      user_role: "customer" | "admin"
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
      chat_role: ["user", "assistant", "system", "tool"],
      coupon_type: ["percent", "fixed"],
      order_status: [
        "pending",
        "paid",
        "fulfilled",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "pending",
        "in_process",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
        "charged_back",
      ],
      shipment_status: [
        "pending",
        "ready",
        "in_transit",
        "delivered",
        "returned",
        "cancelled",
      ],
      user_role: ["customer", "admin"],
    },
  },
} as const
