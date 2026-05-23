import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import { Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner } from '@nextui-org/react';

interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customer?: { name: string };
  category?: { name: string };
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
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-12 px-container-padding-mobile md:px-container-padding-desktop w-full flex-1">
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
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val > endDate) {
                    setEndDate(val);
                  }
                }}
                variant="bordered"
                size="sm"
                className="w-1/2 sm:w-40"
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (startDate && val < startDate) {
                    setStartDate(val);
                  }
                }}
                variant="bordered"
                size="sm"
                className="w-1/2 sm:w-40"
              />
            </div>
            <Button
              color="primary"
              onPress={handleExportExcel}
              startContent={<span className="material-symbols-outlined text-[20px]">table_view</span>}
              className="w-full sm:w-auto font-semibold px-6 py-6 shadow-sm text-label-md text-white"
            >
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">receipt_long</span>
            Recent Transactions
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Preview of the latest transactions.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
        <div className="overflow-x-auto w-full">
          <Table aria-label="Transactions Table" removeWrapper shadow="none" className="min-w-max w-full">
          <TableHeader>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">ID</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Category</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Total</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Date</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Payment</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner label="Memuat transaksi..." />}
            emptyContent="Tidak ada transaksi ditemukan pada rentang tanggal ini."
          >
            {transactions.slice(0, 10).map((trx, index) => (
              <TableRow key={trx.id} className="hover:bg-surface-container-lowest transition-colors group">
                <TableCell className="text-label-md font-label-md text-primary">{trx.invoiceNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm ${index % 2 === 0 ? 'bg-primary-container text-primary' : 'bg-secondary-container text-secondary'}`}>
                      {trx.customer ? getInitials(trx.customer.name) : 'NN'}
                    </div>
                    <span className="text-body-md font-body-md text-on-surface">{trx.customer?.name || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-body-md font-body-md text-on-surface-variant">{trx.category?.name || '-'}</TableCell>
                <TableCell className="text-body-md font-body-md text-on-surface">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.totalPrice)}
                </TableCell>
                <TableCell className="text-body-md font-body-md text-on-surface-variant">
                  {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(trx.createdAt))}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md text-on-surface">{trx.paymentMethod?.name || '-'}</span>
                    <span className={`text-[10px] font-bold ${trx.paymentStatus === 'PAID' ? 'text-secondary' : 'text-error'}`}>
                      {trx.paymentStatus}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-4">
          <div>Showing {Math.min(transactions.length, 10)} of {transactions.length} transactions</div>
        </div>
      </div>
    </div>
  );
}
