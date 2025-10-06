import { useState, useEffect } from 'react';
import { supabase, OrderWithItems } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editOrder?: OrderWithItems | null;
}

interface FormItem {
  id?: string;
  car_type: string;
  quantity: number;
  daily_rate: number;
  days: number;
}

export default function OrderForm({ onClose, onSuccess, editOrder }: OrderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { car_type: '', quantity: 1, daily_rate: 0, days: 1 }
  ]);

  useEffect(() => {
    if (editOrder) {
      setCustomerName(editOrder.customer_name);
      setCustomerPhone(editOrder.customer_phone);
      setCustomerAddress(editOrder.customer_address || '');
      setRentalStartDate(editOrder.rental_start_date);
      setRentalEndDate(editOrder.rental_end_date);
      setNotes(editOrder.notes || '');
      setItems(editOrder.order_items.map(item => ({
        id: item.id,
        car_type: item.car_type,
        quantity: item.quantity,
        daily_rate: item.daily_rate,
        days: item.days
      })));
    }
  }, [editOrder]);

  const addItem = () => setItems([...items, { car_type: '', quantity: 1, daily_rate: 0, days: 1 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof FormItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };
  const calculateTotal = () => items.reduce((total, item) => total + item.quantity * item.daily_rate * item.days, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const totalAmount = calculateTotal();

      if (editOrder) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress || null,
            rental_start_date: rentalStartDate,
            rental_end_date: rentalEndDate,
            total_amount: totalAmount,
            notes: notes || null
          })
          .eq('id', editOrder.id);
        if (orderError) throw orderError;

        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', editOrder.id);
        if (deleteError) throw deleteError;

        const orderItems = items.map(item => ({
          order_id: editOrder.id,
          car_type: item.car_type,
          quantity: item.quantity,
          daily_rate: item.daily_rate,
          days: item.days,
          subtotal: item.quantity * item.daily_rate * item.days
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      } else {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress || null,
            rental_start_date: rentalStartDate,
            rental_end_date: rentalEndDate,
            total_amount: totalAmount,
            notes: notes || null
          })
          .select()
          .single();
        if (orderError) throw orderError;

        const orderItems = items.map(item => ({
          order_id: orderData.id,
          car_type: item.car_type,
          quantity: item.quantity,
          daily_rate: item.daily_rate,
          days: item.days,
          subtotal: item.quantity * item.daily_rate * item.days
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Gagal menyimpan order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{editOrder ? 'Edit Order' : 'Tambah Order Baru'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Customer info, rental dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pelanggan *</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon *</label>
              <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai Sewa *</label>
              <input type="date" required value={rentalStartDate} onChange={(e) => setRentalStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai Sewa *</label>
              <input type="date" required value={rentalEndDate} onChange={(e) => setRentalEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Item Mobil</h3>
              <button type="button" onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                <Plus className="w-4 h-4" /> Tambah Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Mobil *</label>
                      <input type="text" required value={item.car_type} onChange={(e) => updateItem(index, 'car_type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Unit *</label>
                      <input type="number" required min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Hari *</label>
                      <input type="number" required min={1} value={item.days} onChange={(e) => updateItem(index, 'days', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Harga per Hari *</label>
                      <input type="number" required min={0} value={item.daily_rate} onChange={(e) => updateItem(index, 'daily_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                      <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-900">{formatCurrency(item.quantity * item.daily_rate * item.days)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none" />
          </div>

          {/* Total */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Keseluruhan:</span>
              <span className="text-2xl font-bold text-yellow-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Batal
            </button>
            <button type="submit" disabled={loading} className="w-full sm:flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Menyimpan...' : editOrder ? 'Update Order' : 'Simpan Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
