import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// ── Types ──
interface InvoiceData {
  id: string;
  invoiceNumber: string;
  quantity: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  discount: number;
  parfume: string | null;
  rating: number | null;
  createdAt: string;
  finishedAt: string | null;
  takenAt: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    description: string | null;
    pricePerUnit: number;
    unit: string;
    estimatedDurationDays: number;
  } | null;
  paymentMethod: {
    id: string;
    name: string;
  } | null;
}

// ── Helpers ──
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp');

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} - ${hh}:${min}`;
};

const getEstimatedFinish = (createdAt: string, durationDays: number) => {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + (durationDays - 1));
  d.setHours(17, 0, 0, 0);
  return formatDate(d.toISOString());
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'TAKEN': return 'SELESAI / TELAH DIAMBIL';
    case 'FINISHED': return 'SELESAI';
    case 'PROCESS': return 'SEDANG DIPROSES';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'TAKEN': return 'text-green-600 font-bold';
    case 'FINISHED': return 'text-blue-600 font-bold';
    case 'PROCESS': return 'text-amber-600 font-bold';
    default: return 'text-gray-600 font-bold';
  }
};

// ── Star Component ──
function StarIcon({
  filled,
  hovered,
  onPress,
  onMouseEnter,
  onMouseLeave,
  disabled,
}: {
  filled: boolean;
  hovered: boolean;
  onPress: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  disabled: boolean;
}) {
  const color = filled
    ? 'text-yellow-400'
    : hovered
      ? 'text-yellow-300'
      : 'text-gray-300';

  return (
    <svg
      className={`w-9 h-9 ${color} ${disabled ? 'cursor-default opacity-70' : 'cursor-pointer'} transition-all duration-200 ${!disabled && !filled ? 'hover:scale-110' : ''}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      onClick={disabled ? undefined : onPress}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onMouseLeave={disabled ? undefined : onMouseLeave}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// ── API base ──
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '/api/public')
  : '/api/public';

// ── Main Component ──
export function Invoice() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating state
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Fetch invoice
  useEffect(() => {
    if (!invoiceNumber) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const fullInvoiceNumber = invoiceNumber.startsWith('#') ? invoiceNumber : `#${invoiceNumber}`;
        const res = await fetch(`${API_BASE}/invoice/${encodeURIComponent(fullInvoiceNumber)}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Invoice tidak ditemukan' : 'Gagal memuat invoice');
        }
        const json: InvoiceData = await res.json();
        setData(json);

        // If already rated, pre-fill and lock
        if (json.rating !== null) {
          setSelectedRating(json.rating);
          setRatingSubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  // Submit rating
  const handleSubmitRating = async () => {
    if (!invoiceNumber || selectedRating === 0 || submitting) return;

    try {
      setSubmitting(true);
      setRatingError(null);
      const fullInvoiceNumber = invoiceNumber.startsWith('#') ? invoiceNumber : `#${invoiceNumber}`;
      const res = await fetch(`${API_BASE}/invoice/${encodeURIComponent(fullInvoiceNumber)}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal mengirim penilaian');
      }

      setRatingSubmitted(true);
    } catch (err: any) {
      setRatingError(err.message || 'Gagal mengirim penilaian');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invoice Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500">{error || 'Data invoice tidak tersedia.'}</p>
        </div>
      </div>
    );
  }

  const qty = Number(data.quantity);
  const pricePerUnit = data.category?.pricePerUnit ?? 0;
  const subTotal = data.totalPrice;
  const isDisabledRating = ratingSubmitted;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4 sm:py-10">
      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <main className="max-w-md mx-auto space-y-6 relative z-10">
        {/* E-Invoice Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-gray-100/80 p-6 sm:p-8 backdrop-blur-sm">

          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-50">
              <img
                alt="Maxpress Laundromat Logo"
                className="w-48 h-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhrzp-W4ozW4lZpDP4eG4GSW54uKBMSDllMwHxZtohnes0K0aIwDDOAlbY0j2mbWf4OfPPBZ9J5IX9J-jPvzw2DiapMq-XdJEs3k2IKRlv_8Qmr4Nt2PiCyHvexc7qdXFw26qEVqP8aTKG5O44NItuFKHaKLkH3I22uMD_ldbMhR3c8BKBfJrJDIldRJ7xX5ANeBSR1XQj1_GunfxpePSy0Zl_dZe0qwRLtDnH5Dx6-K0wn31qpEjQYOT_33-37jbja_geINNSh2A7"
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto mt-2">
              Apartment Amethys Jalan Rajawali Selatan II No. 6 B, Cnt Utara, Kel Gunung Sahari, Sawah Besar KOTA JAKARTA PUSAT, ID, 10710
            </p>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Customer & Order Details */}
          <div className="space-y-3 text-sm mb-8">
            <div className="flex justify-between">
              <span className="text-gray-400">No Invoice</span>
              <span className="font-medium text-gray-700 text-right">{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pelanggan</span>
              <span className="font-bold text-gray-900 text-right">{data.customer?.name ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tgl Masuk</span>
              <span className="font-medium text-gray-700 text-right">{formatDate(data.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est Selesai</span>
              <span className="font-medium text-gray-700 text-right">
                {data.category
                  ? getEstimatedFinish(data.createdAt, data.category.estimatedDurationDays)
                  : '-'}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8 border-t border-b border-gray-100 py-4">
            <div className="flex flex-col mb-1">
              <span className="font-semibold text-gray-800 mb-1">
                {data.category?.name ?? 'Layanan'}{data.category?.description ? ` (${data.category.description})` : ''}
              </span>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {qty} x {formatCurrency(pricePerUnit)}
                </span>
                <span className="font-medium text-gray-900">{formatCurrency(subTotal)}</span>
              </div>
            </div>
          </div>

          {/* Summary & Payment */}
          <div className="space-y-3 text-sm mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Status Pembayaran</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${data.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {data.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-base font-bold text-gray-900">Total Harga</span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(data.totalPrice)}</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-sm space-y-2 mb-8 border border-blue-100/50">
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 flex-shrink-0">Pembayaran:</span>
              <span className="font-medium text-gray-800">{data.paymentMethod?.name ?? '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 flex-shrink-0">Status:</span>
              <span className={getStatusColor(data.status)}>{getStatusLabel(data.status)}</span>
            </div>
            {data.parfume && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Parfum:</span>
                <span className="font-medium text-gray-800">{data.parfume}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 flex-shrink-0">Keterangan:</span>
              <span className="font-medium text-gray-800">-</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 flex-shrink-0">Notes:</span>
              <span className="font-medium text-gray-800 whitespace-pre-line">
                {[data.paymentMethod?.name, 'BCA 6565125439 a/n NUR PUJI LESTARI'].filter(Boolean).join('\n')}
              </span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">
              Berikan Penilaian Anda
            </h3>
            {ratingSubmitted && (
              <p className="text-xs text-green-600 font-medium mb-3 flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Terima kasih atas penilaian Anda!
              </p>
            )}
            {!ratingSubmitted && (
              <p className="text-xs text-gray-400 mb-3">Ketuk bintang untuk memberi nilai</p>
            )}

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= selectedRating}
                  hovered={star <= hoveredRating && !isDisabledRating}
                  onPress={() => !isDisabledRating && setSelectedRating(star)}
                  onMouseEnter={() => !isDisabledRating && setHoveredRating(star)}
                  onMouseLeave={() => !isDisabledRating && setHoveredRating(0)}
                  disabled={isDisabledRating}
                />
              ))}
            </div>

            {ratingError && (
              <p className="text-xs text-red-500 mb-3">{ratingError}</p>
            )}

            <button
              onClick={handleSubmitRating}
              disabled={isDisabledRating || selectedRating === 0 || submitting}
              className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 mb-4 ${isDisabledRating || selectedRating === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : submitting
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200'
                }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Mengirim...
                </span>
              ) : isDisabledRating ? (
                'Penilaian Terkirim'
              ) : (
                'Kirim Penilaian'
              )}
            </button>

            {!ratingSubmitted && (
              <p className="text-xs text-gray-400">Penilaian Anda sangat berharga bagi kami.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8">
          <p className="text-xs text-gray-400">Copyright © 2024 Maxpress Laundromat - All rights reserved</p>
        </footer>
      </main>
    </div>
  );
}
