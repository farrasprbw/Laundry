import { useState } from 'react';
import { AddOrderModal } from '../components/ui/AddOrderModal';
import { useDashboardStats, useDashboardRecentOrders, useDashboardFinancialTrend } from '../hooks/use-dashboard';

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}


export function Dashboard() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useDashboardRecentOrders(5);
  const { data: trend = [], isLoading: trendLoading } = useDashboardFinancialTrend(7);

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build SVG paths from trend data
  const maxIncome = Math.max(...trend.map(t => t.income), 1);
  const maxExpense = Math.max(...trend.map(t => t.expenses), 1);
  const maxVal = Math.max(maxIncome, maxExpense, 1);

  const buildPath = (values: number[], close = false) => {
    if (values.length === 0) return '';
    const points = values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 95 - (v / maxVal) * 80;
      return { x, y };
    });
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cx1 = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
      const cx2 = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
      d += ` C${cx1},${points[i - 1].y} ${cx2},${points[i].y} ${points[i].x},${points[i].y}`;
    }
    if (close) {
      d += ` L100,100 L0,100 Z`;
    }
    return d;
  };

  const incomeValues = trend.map(t => t.income);
  const expenseValues = trend.map(t => t.expenses);

  const STATUS_STYLES: Record<string, string> = {
    PROCESS: 'bg-primary/10 text-primary',
    FINISHED: 'bg-secondary/10 text-secondary',
    TAKEN: 'bg-surface-variant text-on-surface-variant',
  };

  return (
    <main className="flex-1 pt-24 px-container-padding-desktop pb-container-padding-desktop max-w-[1440px] w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            Dashboard
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">{today}</p>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Order Baru
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter mb-gutter">
        {/* Stat Card 1 - Income */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Income</p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-24 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">{formatRupiah(stats?.todayIncome ?? 0)}</h3>
            )}
            <p className="text-label-sm font-label-sm text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">today</span>
              Today
            </p>
          </div>
        </div>

        {/* Stat Card 2 - Expenses */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Expenses</p>
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[18px]">trending_down</span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-24 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">{formatRupiah(stats?.todayExpenses ?? 0)}</h3>
            )}
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">today</span>
              Today
            </p>
          </div>
        </div>

        {/* Stat Card 3 - Net Profit */}
        <div className="bg-primary text-on-primary border border-primary/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,88,190,0.15)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-label-md font-label-md text-primary-fixed">Net Profit</p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="relative z-10">
            {statsLoading ? (
              <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-white">{formatRupiah(stats?.todayProfit ?? 0)}</h3>
            )}
            <p className="text-label-sm font-label-sm text-primary-fixed mt-1">Today's Earnings</p>
          </div>
        </div>

        {/* Stat Card 4 - Total Orders */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Total Orders</p>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface text-[18px]">local_laundry_service</span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-12 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">{stats?.todayOrderCount ?? 0}</h3>
            )}
            <p className="text-label-sm font-label-sm text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">today</span>
              Today
            </p>
          </div>
        </div>

        {/* Stat Card 5 - Pending Pickups */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Pending Pickups</p>
            <div className="w-8 h-8 rounded-full bg-[#fef08a]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#854d0e] text-[18px]">directions_car</span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-12 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">{stats?.pendingPickups ?? 0}</h3>
            )}
            <p className="text-label-sm font-label-sm text-[#854d0e] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Needs Action
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Charts & Monthly Income */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Financial Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-headline-md font-headline-md text-on-background">Financial Trend</h3>
              <p className="text-label-md font-label-md text-on-surface-variant">Income vs Expenses over the last 7 days</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] relative w-full bg-surface-bright rounded-lg overflow-hidden border border-outline-variant/10">
            {trendLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
                <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"></line>
                <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="75" y2="75"></line>
                {/* Expense area */}
                <path d={buildPath(expenseValues, true)} fill="#ffdad6" opacity="0.4"></path>
                <path d={buildPath(expenseValues)} fill="none" stroke="#ba1a1a" strokeWidth="1.5"></path>
                {/* Income area */}
                <path d={buildPath(incomeValues, true)} fill="url(#blue-gradient)" opacity="0.8"></path>
                <path d={buildPath(incomeValues)} fill="none" stroke="#0058be" strokeWidth="2"></path>
                <defs>
                  <linearGradient id="blue-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d8e2ff" stopOpacity="0.8"></stop>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1"></stop>
                  </linearGradient>
                </defs>
              </svg>
            )}
            {/* Date labels */}
            {!trendLoading && trend.length > 0 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
                {trend.map((t, i) => (
                  <span key={i} className="text-[9px] text-on-surface-variant/60">
                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md text-on-background">Monthly Summary</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="text-center">
              <p className="text-label-md font-label-md text-on-surface-variant mb-2">Total Income (Bulan Ini)</p>
              {statsLoading ? (
                <div className="h-10 w-32 mx-auto bg-surface-variant/50 rounded animate-pulse" />
              ) : (
                <h3 className="text-display-sm font-headline-lg text-primary">{formatRupiah(stats?.monthlyIncome ?? 0)}</h3>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/10">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">trending_up</span>
                <p className="text-label-sm text-on-surface-variant">Income Today</p>
                <p className="text-label-md font-bold text-on-background">{formatRupiah(stats?.todayIncome ?? 0)}</p>
              </div>
              <div className="bg-error/5 rounded-lg p-4 text-center border border-error/10">
                <span className="material-symbols-outlined text-error text-[24px] mb-1">trending_down</span>
                <p className="text-label-sm text-on-surface-variant">Expense Today</p>
                <p className="text-label-md font-bold text-on-background">{formatRupiah(stats?.todayExpenses ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-gutter bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="text-headline-md font-headline-md text-on-background">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-background">
              {ordersLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px] opacity-70 mb-2 block">receipt_long</span>
                    Belum ada order
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer">
                    <td className="py-4 px-6 text-label-md font-label-md text-primary">{order.invoiceNumber}</td>
                    <td className="py-4 px-6">{order.customer?.name ?? '-'}</td>
                    <td className="py-4 px-6">{order.category?.name ?? '-'}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{parseFloat(order.quantity)} {order.category?.unit ?? ''}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-surface-variant text-on-surface-variant'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">Rp {Number(order.totalPrice).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </main>
  );
}
