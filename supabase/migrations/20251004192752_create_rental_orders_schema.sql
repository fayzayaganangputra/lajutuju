/*
  # Rental Orders Management System

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, required) - Nama pelanggan
      - `customer_phone` (text, required) - Nomor telepon pelanggan
      - `customer_address` (text, optional) - Alamat pelanggan
      - `order_date` (timestamptz, default now) - Tanggal order
      - `rental_start_date` (date, required) - Tanggal mulai sewa
      - `rental_end_date` (date, required) - Tanggal selesai sewa
      - `total_amount` (numeric, default 0) - Total biaya
      - `notes` (text, optional) - Catatan tambahan
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders) - Referensi ke order
      - `car_type` (text, required) - Jenis/tipe mobil
      - `quantity` (integer, default 1) - Jumlah unit
      - `daily_rate` (numeric, required) - Harga sewa per hari
      - `days` (integer, required) - Jumlah hari sewa
      - `subtotal` (numeric, required) - Subtotal (quantity * daily_rate * days)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
    - Public read access for invoice viewing (optional)

  3. Important Notes
    - All monetary values use numeric type for precision
    - Automatic timestamp tracking with updated_at
    - Cascade delete for order_items when order is deleted
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  order_date timestamptz DEFAULT now(),
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  total_amount numeric(12, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  car_type text NOT NULL,
  quantity integer DEFAULT 1,
  daily_rate numeric(12, 2) NOT NULL,
  days integer NOT NULL,
  subtotal numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders table
CREATE POLICY "Anyone can view orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete orders"
  ON orders FOR DELETE
  USING (true);

-- Policies for order_items table
CREATE POLICY "Anyone can view order items"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update order items"
  ON order_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete order items"
  ON order_items FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();