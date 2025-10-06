import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Calendar, DollarSign, FileBarChart } from 'lucide-react';

interface MonthlyData {
  month: string;
  year: number;
  order_count: number;
  total_revenue: number;
}

export default function MonthlyReport() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear]);

  const fetchMonthlyReport = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('order_date, total_amount')
        .order('order_date', { ascending: false });

      if (error) throw error;

      const years = new Set<number>();
      const monthlyMap = new Map<string, MonthlyData>();

      (data || []).forEach(order => {
        const orderDate = new Date(order.order_date);
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth();

        years.add(year);

        if (year === selectedYear) {
          const key = `${year}-${month}`;
          const monthName = new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long' });

          if (monthlyMap.has(key)) {
            const existing = monthlyMap.get(key)!;
            existing.order_count += 1;
            existing.total_revenue += parseFloat(order.total_amount.toString());
          } else {
            monthlyMap.set(key, {
              month: monthName,
              year: year,
              order_count: 1,
              total_revenue: parseFloat(order.total_amount.toString())
            });
          }
        }
      });

      const sortedYears = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(sortedYears);

      const sortedData = Array.from(monthlyMap.values()).sort((a, b) => {
        const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
        const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
        return monthA - monthB;
      });

      setMonthlyData(sortedData);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalOrders = () => {
    return monthlyData.reduce((sum, data) => sum + data.order_count, 0);
  };

  const getTotalRevenue = () => {
    return monthlyData.reduce((sum, data) => sum + data.total_revenue, 0);
  };

  const getAverageRevenue = () => {
    if (monthlyData.length === 0) return 0;
    return getTotalRevenue() / monthlyData.length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-3 rounded-lg">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan Bulanan</h2>
              <p className="text-sm text-gray-600">Statistik order dan pendapatan</p>
            </div>
          </div>

          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium text-gray-900"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Total Order</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{getTotalOrders()}</p>
            <p className="text-xs text-orange-600 mt-1">order masuk tahun {selectedYear}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Total Pendapatan</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(getTotalRevenue())}</p>
            <p className="text-xs text-green-700 mt-1">pendapatan tahun {selectedYear}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Rata-rata/Bulan</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatCurrency(getAverageRevenue())}</p>
            <p className="text-xs text-purple-700 mt-1">pendapatan rata-rata per bulan</p>
          </div>
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileBarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Belum ada data untuk tahun {selectedYear}</p>
          <p className="text-gray-400 text-sm mt-2">Data akan muncul setelah ada order masuk</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-600 text-white">
                  <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold">Bulan</th>
                  <th className="text-center px-4 sm:px-6 py-4 text-sm font-semibold">Jumlah Order</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-sm font-semibold">Total Pendapatan</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-sm font-semibold hidden sm:table-cell">Rata-rata Order</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr
                    key={`${data.year}-${data.month}`}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors`}
                  >
                    <td className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{data.month} {data.year}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 border-b border-gray-200 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold text-sm">
                        {data.order_count} order
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 border-b border-gray-200 text-right font-semibold text-gray-900">
                      {formatCurrency(data.total_revenue)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 border-b border-gray-200 text-right text-gray-600 hidden sm:table-cell">
                      {formatCurrency(data.total_revenue / data.order_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-orange-50 border-t-2 border-orange-600 font-bold">
                  <td className="px-4 sm:px-6 py-4 text-gray-900">TOTAL</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-orange-600">{getTotalOrders()} order</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-orange-600">{formatCurrency(getTotalRevenue())}</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-orange-600 hidden sm:table-cell">
                    {formatCurrency(getAverageRevenue())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
