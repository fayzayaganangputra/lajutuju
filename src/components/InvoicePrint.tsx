import { useEffect, useRef } from 'react';
import { OrderWithItems } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePrintProps {
  order: OrderWithItems;
  onClose: () => void;
}

export default function InvoicePrint({ order, onClose }: InvoicePrintProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    const invoiceElement = invoiceRef.current;
    const originalStyles = { ...invoiceElement.style };

    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '0';
    invoiceElement.style.width = '794px';
    invoiceElement.style.maxWidth = 'none';
    invoiceElement.style.zIndex = '-1';
    invoiceElement.style.transform = 'scale(1)';

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        backgroundColor: '#ffffff',
      } as any);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      let heightLeft = height;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, width, height, '', 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - height;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, width, height, '', 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice-${order.id.substring(0, 8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      Object.assign(invoiceElement.style, originalStyles);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl my-8 rounded-lg shadow-2xl overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Preview Invoice</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Cetak Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 print:p-12" ref={invoiceRef} id="invoice-content">
          <div className="border-4 border-orange-600 rounded-lg p-6" style={{ width: '100%' }}>
            {/* Logo & Info */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-orange-600">
              <div>
                <img src="logo.png" alt="Logo Laju Tuju" className="w-44 h-auto object-contain block" />
                <div className="text-sm text-gray-600 leading-tight mt-2">
                  <p>Soka Asri Permai, Kadisoka, Purwomartani, Kalasan Sleman</p>
                  <p>
                    Telp:{' '}
                    <span className="no-underline decoration-none">{order.customer_phone}</span>
                  </p>
                  <p>
                    Email:{' '}
                    <a href="mailto:contact@lajutuju.com" className="ml-1 text-blue-500 underline hover:text-blue-700">
                      contact@lajutuju.com
                    </a>
                  </p>
                  <p>
                    Website:{' '}
                    <a href="https://lajutuju.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 underline hover:text-blue-700">
                      lajutuju.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">
                    <span className="font-semibold">No. Invoice:</span>
                    <br />
                    <span className="font-mono text-gray-900 no-underline decoration-none">#{order.id.substring(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Tanggal:</span>
                    <br />
                    <span className="text-gray-900">{formatDate(order.order_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pelanggan & Periode */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-gray-300">
              <div>
                <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Informasi Pelanggan</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 font-semibold">{order.customer_name}</p>
                  <p className="text-gray-600">
                    <span className="font-medium">Telepon:</span>{' '}
                    <span className="no-underline decoration-none">{order.customer_phone}</span>
                  </p>
                  {order.customer_address && (
                    <p className="text-gray-600">
                      <span className="font-medium">Alamat:</span> {order.customer_address}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Periode Sewa</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Mulai:</span>{' '}
                    <span className="font-semibold">{formatDate(order.rental_start_date)}</span>
                  </p>
                  <p>
                    <span className="font-medium">Selesai:</span>{' '}
                    <span className="font-semibold">{formatDate(order.rental_end_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian Item */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Rincian Item Sewa</h3>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-orange-600 text-white font-semibold">
                      <th className="px-3 py-2 text-left border-r border-orange-500">Tipe Mobil</th>
                      <th className="px-3 py-2 text-center border-r border-orange-500">Unit</th>
                      <th className="px-3 py-2 text-center border-r border-orange-500">Hari</th>
                      <th className="px-3 py-2 text-right border-r border-orange-500">Harga/Hari</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-gray-900 font-medium">{item.car_type}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-center text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-center text-gray-700">{item.days}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-right text-gray-700">{formatCurrency(item.daily_rate)}</td>
                        <td className="px-3 py-2 border-b border-gray-300 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-6">
              <div className="w-full max-w-md">
                <div className="bg-orange-600 text-white p-4 rounded-lg flex justify-between items-center">
                  <span className="font-bold uppercase">Total Pembayaran</span>
                  <span className="text-xl font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Informasi Pembayaran */}
            <div className="mb-6 pb-4 border-b border-gray-300">
              <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Informasi Pembayaran</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Bank:</span> BCA</p>
                <p>
                  <span className="font-medium">No. Rekening:</span>{' '}
                  <span className="font-mono font-semibold no-underline decoration-none">4561059637</span>
                </p>
                <p><span className="font-medium">Atas Nama:</span> Moh Fajar Yogyaning Praharu</p>
              </div>
            </div>

            {/* Catatan */}
            {order.notes && (
              <div className="mb-6 pb-4 border-b border-gray-300">
                <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Catatan</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-gray-700">{order.notes}</div>
              </div>
            )}

            {/* QR Code */}
            <div className="grid grid-cols-2 gap-6 text-center mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Laju Tuju</p>
                <QRCodeCanvas value={`Processed by System`} size={80} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
