import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customer?: { name: string };
  totalPrice: number;
  paymentMethod?: { name: string };
  paymentStatus: string;
  status: string;
}

export function Reports() {
  // Initialize with today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;

  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/reports/transactions', {
        params: {
          dateFrom: startDate || undefined,
          dateTo: endDate || undefined,
        }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!startDate || !endDate) return;
    setIsLoadingSummary(true);
    try {
      const response = await apiClient.get('/reports/summary', {
        params: { dateFrom: startDate, dateTo: endDate }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [startDate, endDate]);

  const handleExportExcel = async () => {
    try {
      if (!startDate || !endDate) {
        alert("Pilih Start Date dan End Date untuk export.");
        return;
      }
      const response = await apiClient.get('/reports/export', {
        params: {
          dateFrom: startDate,
          dateTo: endDate,
        },
        responseType: 'blob', // Important for downloading files
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `laundry_report_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Gagal mengekspor laporan');
    }
  };
  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-12 px-container-padding-mobile md:px-container-padding-desktop max-w-[1440px] w-full flex-1">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-on-surface">Financial Reports</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Overview of revenue, expenses, and profitability.</p>
        </div>
        <div className="flex items-center gap-3">
        </div>
      </header>

      {/* Summary Cards (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Revenue Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">account_balance_wallet</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Revenue</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-surface mb-2">
            {isLoadingSummary ? '...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary.totalIncome)}
          </div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm">
            <span className="text-on-surface-variant">Periode yang dipilih</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-error">money_off</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">trending_down</span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Expenses</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-surface mb-2">
            {isLoadingSummary ? '...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary.totalExpenses)}
          </div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm">
            <span className="text-on-surface-variant">Periode yang dipilih</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-primary text-on-primary rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,88,190,0.15)] hover:shadow-[0_10px_30px_rgba(0,88,190,0.25)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-container rounded-full blur-2xl opacity-50"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-on-primary">savings</span>
            </div>
            <h3 className="text-label-md font-label-md text-primary-fixed-dim uppercase tracking-wider">Net Profit</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-primary mb-2 relative z-10">
            {isLoadingSummary ? '...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary.netProfit)}
          </div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm relative z-10">
            <span className="text-primary-fixed-dim">Periode yang dipilih</span>
          </div>
        </div>
      </div>

      {/* Export & Settings Section (Glassmorphism Card) */}
      <div className="bg-surface/60 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 mb-10 shadow-sm relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span>
              Export Report
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">Generate detailed spreadsheets for accounting.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto flex gap-2">
              <div className="w-1/2 sm:w-auto">
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 ml-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDate(val);
                      if (endDate && val > endDate) {
                        setEndDate(val);
                      }
                    }}
                    className="bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-label-md font-label-md rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="w-1/2 sm:w-auto">
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 ml-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEndDate(val);
                      if (startDate && val < startDate) {
                        setStartDate(val);
                      }
                    }}
                    className="bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-label-md font-label-md rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleExportExcel}
              className="w-full sm:w-auto bg-primary text-on-primary hover:bg-primary-container transition-colors px-6 py-2.5 rounded-lg text-label-md font-label-md flex items-center justify-center gap-2 shadow-sm font-semibold h-[42px]"
            >
              <span className="material-symbols-outlined text-[20px]">table_view</span>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface/30">
          <h3 className="text-headline-md font-headline-md text-on-surface">Recent Transactions Preview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider border-b border-outline-variant/20">
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">No. Invoice</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Payment Method</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Category (Status)</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">Memuat data...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada transaksi ditemukan pada rentang tanggal ini.</td>
                </tr>
              ) : (
                transactions.slice(0, 10).map((trx) => (
                  <tr key={trx.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface text-label-md font-label-md font-medium">{trx.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-body-md">
                      {new Date(trx.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-on-surface text-body-md">{trx.customer?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-primary">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.totalPrice)}
                    </td>
                    <td className="px-6 py-4 text-center text-on-surface-variant text-body-md">{trx.paymentMethod?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm ${trx.paymentStatus === 'PAID' ? 'bg-secondary-container/30 text-secondary' : 'bg-error-container/30 text-error'}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {trx.paymentStatus === 'PAID' ? 'check_circle' : 'pending'}
                        </span>
                        {trx.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface/30 text-center">
          <p className="text-label-sm font-label-sm text-on-surface-variant">Showing {Math.min(transactions.length, 10)} of {transactions.length} transactions</p>
        </div>
      </div>
    </div>
  );
}
