export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address?: string
  order_date: string
  rental_start_date: string
  rental_end_date: string
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  car_type: string
  quantity: number
  daily_rate: number
  days: number
  subtotal: number
  created_at: string
}
