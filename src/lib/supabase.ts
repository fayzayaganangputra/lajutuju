import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  order_date: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  car_type: string;
  quantity: number;
  daily_rate: number;
  days: number;
  subtotal: number;
  created_at: string;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};
