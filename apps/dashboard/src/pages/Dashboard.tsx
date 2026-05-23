import { useState } from 'react';
import { AddOrderModal } from '../components/ui/AddOrderModal';
import { useDashboardStats, useDashboardRecentOrders, useDashboardFinancialTrend } from '../hooks/use-dashboard';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from '@nextui-org/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-on-surface-variant font-medium mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-on-surface-variant">{entry.name}:</span>
          <span className="font-semibold text-on-background">Rp {Number(entry.value).toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  );
}


export function Dashboard() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useDashboardRecentOrders(5);
  const { data: trend = [], isLoading: trendLoading } = useDashboardFinancialTrend(7);

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Format trend data for Recharts
  const chartData = trend.map(t => ({
    date: new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    Income: t.income,
    Expenses: t.expenses,
  }));

  const STATUS_COLORS: Record<string, "primary" | "secondary" | "default" | "success" | "warning" | "danger"> = {
    PROCESS: 'primary',
    FINISHED: 'secondary',
    TAKEN: 'default',
  };

  return (
    <main className="flex-1 pt-24 px-container-padding-desktop pb-container-padding-desktop w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            Dashboard
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">{today}</p>
        </div>
        <Button
          color="primary"
          onPress={() => setIsOrderModalOpen(true)}
          startContent={<span className="material-symbols-outlined text-[18px]">add</span>}
          className="px-6 py-6 rounded-lg text-label-md font-label-md shadow-sm text-white"
        >
          Order Baru
        </Button>
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

          <div className="flex-1 min-h-[300px] relative w-full bg-surface-bright rounded-lg overflow-hidden border border-outline-variant/10 p-4">
            {trendLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner label="Memuat grafik..." />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0058be" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0058be" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ba1a1a" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ba1a1a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatRupiah(v)}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#ba1a1a"
                    strokeWidth={1.5}
                    fill="url(#expenseGradient)"
                    dot={{ r: 3, fill: '#ba1a1a', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, stroke: '#ba1a1a', strokeWidth: 2, fill: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#0058be"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                    dot={{ r: 3.5, fill: '#0058be', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, stroke: '#0058be', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
      <div className="mt-gutter bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden p-6">
        <h3 className="text-headline-md font-headline-md text-on-background mb-4">Recent Orders</h3>
        <div className="overflow-x-auto w-full">
          <Table aria-label="Recent Orders Table" removeWrapper shadow="none" className="min-w-max w-full">
          <TableHeader>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Service</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Qty</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</TableColumn>
            <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={ordersLoading}
            loadingContent={<Spinner label="Memuat order..." />}
            emptyContent="Belum ada order"
          >
            {recentOrders.map((order) => (
              <TableRow key={order.id} className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer">
                <TableCell className="py-4 text-label-md font-label-md text-primary">{order.invoiceNumber}</TableCell>
                <TableCell className="py-4">{order.customer?.name ?? '-'}</TableCell>
                <TableCell className="py-4">{order.category?.name ?? '-'}</TableCell>
                <TableCell className="py-4 text-on-surface-variant">{parseFloat(order.quantity)} {order.category?.unit ?? ''}</TableCell>
                <TableCell className="py-4">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={STATUS_COLORS[order.status] ?? 'default'}
                  >
                    {order.status}
                  </Chip>
                </TableCell>
                <TableCell className="py-4 text-right font-medium">Rp {Number(order.totalPrice).toLocaleString('id-ID')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </div>

      <AddOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </main>
  );
}
