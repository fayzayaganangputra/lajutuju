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

    // Simpan style asli
    const originalWidth = invoiceRef.current.style.width;
    const originalMaxWidth = invoiceRef.current.style.maxWidth;

    // Pastikan lebar elemen full agar tidak gepeng
    invoiceRef.current.style.width = '100%';
    invoiceRef.current.style.maxWidth = 'none';

    const scale = 3; // tinggi supaya tajam di HP

    // Pakai 'as any' supaya TypeScript tidak complain
    const canvas = await html2canvas(invoiceRef.current, {
      scale,
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY,
    } as any);

    // Kembalikan style asli
    invoiceRef.current.style.width = originalWidth;
    invoiceRef.current.style.maxWidth = originalMaxWidth;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      const heightToPrint = remainingHeight > pdfHeight ? pdfHeight : remainingHeight;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, heightToPrint);
      remainingHeight -= pdfHeight;
      position -= pdfHeight;
      if (remainingHeight > 0) pdf.addPage();
    }

    pdf.save(`Invoice-${order.id}.pdf`);
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

        {/* Content */}
        <div className="p-6 print:p-12" ref={invoiceRef} id="invoice-content">
          <div className="border-4 border-orange-600 rounded-lg p-6">
            {/* Header Invoice */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-orange-600">
              <div>
                <img src="logo.png" alt="Logo Laju Tuju" className="w-44 h-44 object-contain block" />
                <div className="text-sm text-gray-600 leading-tight mt-2">
                  <p>Soka Asri Permai, Kadisoka, Purwomartani, Kalasan Sleman</p>
                  <p>Telp: 082138568822</p>
                  <p>
                    Email: 
                    <a href="mailto:contact@lajutuju.com" className="ml-1 text-blue-500 underline hover:text-blue-700">
                      contact@lajutuju.com
                    </a>
                  </p>
                  <p>
                    Website: 
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
                    <span className="font-semibold">No. Invoice:</span><br />
                    <span className="font-mono text-gray-900">#{order.id.substring(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Tanggal:</span><br />
                    <span className="text-gray-900">{formatDate(order.order_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Informasi Pelanggan & Periode */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-gray-300">
              <div>
                <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Informasi Pelanggan</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 font-semibold">{order.customer_name}</p>
                  <p className="text-gray-600"><span className="font-medium">Telepon:</span> {order.customer_phone}</p>
                  {order.customer_address && (
                    <p className="text-gray-600"><span className="font-medium">Alamat:</span> {order.customer_address}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Periode Sewa</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="font-medium">Mulai:</span> <span className="font-semibold">{formatDate(order.rental_start_date)}</span></p>
                  <p><span className="font-medium">Selesai:</span> <span className="font-semibold">{formatDate(order.rental_end_date)}</span></p>
                </div>
              </div>
            </div>

            {/* Rincian Item */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">Rincian Item Sewa</h3>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-600 text-white text-sm font-semibold">
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
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-sm font-medium text-gray-900">{item.car_type}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-sm text-center text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-sm text-center text-gray-700">{item.days}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-300 text-sm text-right text-gray-700">{formatCurrency(item.daily_rate)}</td>
                        <td className="px-3 py-2 border-b border-gray-300 text-sm text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Pembayaran */}
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
                <p><span className="font-medium">Bank:</span> Mandiri</p>
                <p><span className="font-medium">No. Rekening:</span> <span className="font-mono font-semibold">1370018835948</span></p>
                <p><span className="font-medium">Atas Nama:</span> Fayzaya Ganang Putra</p>
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
