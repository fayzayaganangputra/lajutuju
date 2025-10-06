import { useEffect, useState } from 'react';
import { supabase, OrderWithItems } from '../lib/supabase';
import { FileText, Trash2, CreditCard as Edit, Printer } from 'lucide-react';

interface OrderListProps {
  onEdit: (order: OrderWithItems) => void;
  onPrint: (order: OrderWithItems) => void;
  refresh: number;
}

export default function OrderList({ onEdit, onPrint, refresh }: OrderListProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [refresh]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });

          return {
            ...order,
            order_items: items || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Yakin ingin menghapus order ini?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Gagal menghapus order');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Belum ada order sewa mobil</p>
        <p className="text-gray-400 text-sm mt-2">Klik tombol "Tambah Order" untuk membuat order baru</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{order.customer_name}</h3>
                <p className="text-gray-600 text-sm sm:text-base">{order.customer_phone}</p>
                {order.customer_address && (
                  <p className="text-gray-500 text-sm mt-1">{order.customer_address}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onPrint(order)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => onEdit(order)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Tanggal Order:</span>
                <span className="ml-2 font-medium text-gray-900">{formatDate(order.order_date)}</span>
              </div>
              <div>
                <span className="text-gray-500">Periode Sewa:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDate(order.rental_start_date)} - {formatDate(order.rental_end_date)}
                </span>
              </div>
            </div>

            {order.order_items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">Item Sewa:</h4>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{item.car_type}</span>
                        <span className="text-gray-600 ml-2">
                          ({item.quantity} unit × {item.days} hari)
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-gray-600 font-medium text-sm sm:text-base">Total:</span>
              <span className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
            </div>

            {order.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Catatan:</span> {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
