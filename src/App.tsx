import { useState } from 'react';
import { Plus, FileText, BarChart3, LogOut } from 'lucide-react';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import InvoicePrint from './components/InvoicePrint';
import MonthlyReport from './components/MonthlyReport';
import Auth from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { OrderWithItems } from './lib/supabase';

type ViewMode = 'orders' | 'reports';

function App() {
  const { user, loading, signOut } = useAuth();

  // 🧩 Semua hook harus dideklarasikan di atas, sebelum ada return
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [showForm, setShowForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderWithItems | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderWithItems | null>(null);
  const [refresh, setRefresh] = useState(0);

  const handleSuccess = () => setRefresh(prev => prev + 1);
  const handleEdit = (order: OrderWithItems) => {
    setEditOrder(order);
    setShowForm(true);
  };
  const handlePrint = (order: OrderWithItems) => {
    setPrintOrder(order);
    setShowInvoice(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditOrder(null);
  };
  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setPrintOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-yellow-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-xl shadow-md">
                  <img 
                    src="lajutuju.png" 
                    alt="Logo Laju Tuju" 
                    className="w-12 h-12 object-contain rounded-md"
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">LAJU TUJU</h1>
                  <p className="text-sm text-gray-600">Sistem Manajemen Order Sewa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {viewMode === 'orders' && (
                  <button
                    onClick={() => {
                      setEditOrder(null);
                      setShowForm(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-yellow-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Order</span>
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 pt-4">
              <button
                onClick={() => setViewMode('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'orders'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Daftar Order</span>
                <span className="sm:hidden">Order</span>
              </button>
              <button
                onClick={() => setViewMode('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'reports'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Laporan Bulanan</span>
                <span className="sm:hidden">Laporan</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'orders' ? (
          <OrderList
            onEdit={handleEdit}
            onPrint={handlePrint}
            refresh={refresh}
          />
        ) : (
          <MonthlyReport />
        )}

        {showForm && (
          <OrderForm
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
            editOrder={editOrder}
          />
        )}

        {showInvoice && printOrder && (
          <InvoicePrint
            order={printOrder}
            onClose={handleCloseInvoice}
          />
        )}
      </div>
    </div>
  );
}

export default App;
