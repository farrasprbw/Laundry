import { useState } from "react";
import { AddOrderModal } from "../components/ui/AddOrderModal";
import {
  useDashboardStats,
  useDashboardRecentOrders,
  useDashboardFinancialTrend,
  useDashboardAnalytics,
} from "../hooks/use-dashboard";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Avatar,
  ButtonGroup,
} from "@nextui-org/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-on-surface-variant font-medium mb-1.5">{label}</p>
      {payload.map(
        (entry: { name: string; value: number; color?: string }, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-on-surface-variant">{entry.name}:</span>
            <span className="font-semibold text-on-background">
              {entry.name === "Orders"
                ? entry.value
                : `Rp ${Number(entry.value).toLocaleString("id-ID")}`}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

function ChangeBadge({ percent }: { percent: number }) {
  if (percent === 0)
    return (
      <span className="text-label-sm text-on-surface-variant ml-2">
        • 0% vs last month
      </span>
    );
  const isPositive = percent > 0;
  return (
    <span
      className={`text-label-sm ml-2 font-medium ${isPositive ? "text-success" : "text-error"}`}
    >
      {isPositive ? "▲" : "▼"} {Math.abs(percent)}%{" "}
      <span className="text-on-surface-variant font-normal">vs last month</span>
    </span>
  );
}

export function Dashboard() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<7 | 14 | 30>(7);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentOrders = [], isLoading: ordersLoading } =
    useDashboardRecentOrders(5);
  const { data: trend = [], isLoading: trendLoading } =
    useDashboardFinancialTrend(trendPeriod);
  const { data: analytics, isLoading: analyticsLoading } =
    useDashboardAnalytics();

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format trend data for Recharts
  const chartData = trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    Income: t.income,
    Expenses: t.expenses,
  }));

  const STATUS_COLORS: Record<
    string,
    "primary" | "secondary" | "default" | "success" | "warning" | "danger"
  > = {
    PROCESS: "primary",
    FINISHED: "secondary",
    TAKEN: "default",
  };

  return (
    <main className="flex-1 pt-24 px-container-padding-desktop pb-container-padding-desktop w-full overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            Dashboard
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            {today}
          </p>
        </div>
        <Button
          color="primary"
          onPress={() => setIsOrderModalOpen(true)}
          startContent={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
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
            <p className="text-label-md font-label-md text-on-surface-variant">
              Income Today
            </p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">
                trending_up
              </span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-24 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">
                {formatRupiah(stats?.todayIncome ?? 0)}
              </h3>
            )}
            <div className="mt-1 flex items-center">
              <p className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  today
                </span>
                Today
              </p>
              {analytics && (
                <ChangeBadge
                  percent={analytics.monthComparison.incomeChangePercent}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Expenses */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">
              Expenses Today
            </p>
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[18px]">
                trending_down
              </span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-24 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">
                {formatRupiah(stats?.todayExpenses ?? 0)}
              </h3>
            )}
            <div className="mt-1 flex items-center">
              <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  today
                </span>
                Today
              </p>
              {analytics && (
                <ChangeBadge
                  percent={analytics.monthComparison.expenseChangePercent}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Net Profit */}
        <div className="bg-primary text-on-primary border border-primary/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,88,190,0.15)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-label-md font-label-md text-primary-fixed">
              Net Profit
            </p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-[18px]">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="relative z-10">
            {statsLoading ? (
              <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-white">
                {formatRupiah(stats?.todayProfit ?? 0)}
              </h3>
            )}
            <p className="text-label-sm font-label-sm text-primary-fixed mt-1">
              Today's Earnings
            </p>
          </div>
        </div>

        {/* Stat Card 4 - Total Orders */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">
              Total Orders
            </p>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface text-[18px]">
                local_laundry_service
              </span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-12 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">
                {stats?.todayOrderCount ?? 0}
              </h3>
            )}
            <div className="mt-1 flex items-center">
              <p className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  today
                </span>
                Today
              </p>
              {analytics && (
                <ChangeBadge
                  percent={analytics.monthComparison.orderChangePercent}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stat Card 5 - Pending Pickups */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">
              Pending Pickups
            </p>
            <div className="w-8 h-8 rounded-full bg-[#fef08a]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#854d0e] text-[18px]">
                directions_car
              </span>
            </div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-8 w-12 bg-surface-variant/50 rounded animate-pulse" />
            ) : (
              <h3 className="text-headline-md font-headline-md text-on-background">
                {stats?.pendingPickups ?? 0}
              </h3>
            )}
            <p className="text-label-sm font-label-sm text-[#854d0e] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>
              Needs Action
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Charts & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Financial Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-headline-md font-headline-md text-on-background">
                Financial Trend
              </h3>
              <p className="text-label-md font-label-md text-on-surface-variant">
                Income vs Expenses
              </p>
            </div>
            <ButtonGroup size="sm" variant="flat">
              <Button
                color={trendPeriod === 7 ? "primary" : "default"}
                onPress={() => setTrendPeriod(7)}
              >
                7 Hari
              </Button>
              <Button
                color={trendPeriod === 14 ? "primary" : "default"}
                onPress={() => setTrendPeriod(14)}
              >
                14 Hari
              </Button>
              <Button
                color={trendPeriod === 30 ? "primary" : "default"}
                onPress={() => setTrendPeriod(30)}
              >
                30 Hari
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex-1 min-h-[300px] relative w-full bg-surface-bright rounded-lg overflow-hidden border border-outline-variant/10 p-4">
            {trendLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner label="Memuat grafik..." />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="incomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#0058be" stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor="#0058be"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="expenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ba1a1a" stopOpacity={0.2} />
                      <stop
                        offset="100%"
                        stopColor="#ba1a1a"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatRupiah(v)}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
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
                  />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#0058be"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Summary & Rating Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md text-on-background">
              Monthly Summary
            </h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="text-center">
              <p className="text-label-md font-label-md text-on-surface-variant mb-2">
                Total Income (Bulan Ini)
              </p>
              {statsLoading ? (
                <div className="h-10 w-32 mx-auto bg-surface-variant/50 rounded animate-pulse" />
              ) : (
                <h3 className="text-display-sm font-headline-lg text-primary">
                  {formatRupiah(stats?.monthlyIncome ?? 0)}
                </h3>
              )}
            </div>

            <div className="bg-surface-bright rounded-lg p-6 border border-outline-variant/20 flex flex-col items-center justify-center">
              <p className="text-label-md font-label-md text-on-surface-variant mb-3">
                Customer Satisfaction
              </p>
              {analyticsLoading ? (
                <Spinner size="sm" />
              ) : analytics?.averageRating ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-display-sm font-bold text-on-background">
                      {analytics.averageRating}
                    </span>
                    <span
                      className="material-symbols-outlined text-[#eab308] text-[32px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Dari {analytics.totalRatings} ulasan
                  </p>
                </div>
              ) : (
                <p className="text-label-md text-on-surface-variant italic">
                  Belum ada ulasan
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Lists: Top Customers & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mt-gutter">
        {/* Top 5 Customers */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md">
          <h3 className="text-headline-md font-headline-md text-on-background mb-4">
            Top 5 Pelanggan Bulan Ini
          </h3>
          {analyticsLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : analytics?.topCustomers?.length === 0 ? (
            <p className="text-on-surface-variant italic text-center p-8">
              Belum ada pelanggan bulan ini.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {analytics?.topCustomers.map((customer, idx) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 bg-surface-bright p-3 rounded-lg border border-outline-variant/10"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <Avatar name={customer.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg font-bold text-on-background truncate">
                      {customer.name}
                    </p>
                    <p className="text-label-sm text-on-surface-variant truncate">
                      {customer.orderCount} pesanan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-label-md font-bold text-primary">
                      {formatRupiah(customer.totalSpent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md">
          <h3 className="text-headline-md font-headline-md text-on-background mb-4">
            Kategori Terlaris Bulan Ini
          </h3>
          {analyticsLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : analytics?.topCategories?.length === 0 ? (
            <p className="text-on-surface-variant italic text-center p-8">
              Belum ada order bulan ini.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {analytics?.topCategories.slice(0, 5).map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-4 bg-surface-bright p-3 rounded-lg border border-outline-variant/10"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary">
                      {category.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg font-bold text-on-background truncate">
                      {category.name}
                    </p>
                    <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-secondary h-full rounded-full"
                        style={{
                          width: `${Math.max(5, (category.orderCount / Math.max(...analytics.topCategories.map((c) => c.orderCount))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-label-md font-bold text-on-background">
                      {category.orderCount}x
                    </p>
                    <p className="text-label-sm text-secondary">
                      {formatRupiah(category.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="mt-gutter bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md">
        <h3 className="text-headline-md font-headline-md text-on-background mb-1">
          Jam Sibuk
        </h3>
        <p className="text-label-md text-on-surface-variant mb-6">
          Distribusi waktu pemesanan bulan ini
        </p>

        <div className="h-[250px] w-full">
          {analyticsLoading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.ordersByHour ?? []}
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(val) => `${String(val).padStart(2, "0")}:00`}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg p-3 text-sm">
                        <p className="text-on-surface-variant font-medium mb-1">
                          {String(payload[0].payload.hour).padStart(2, "0")}:00
                        </p>
                        <p className="text-on-background font-bold">
                          {payload[0].value} pesanan
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics?.ordersByHour.map((entry, index) => {
                    const max = Math.max(
                      ...(analytics?.ordersByHour.map((h) => h.count) ?? [0]),
                    );
                    const isPeak = entry.count === max && max > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPeak ? "#0058be" : "#94a3b8"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-gutter bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden p-6">
        <h3 className="text-headline-md font-headline-md text-on-background mb-4">
          Recent Orders
        </h3>
        <div className="overflow-x-auto w-full">
          <Table
            aria-label="Recent Orders Table"
            removeWrapper
            shadow="none"
            className="min-w-max w-full"
          >
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Order ID
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Customer
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Service
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Qty
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Status
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                Amount
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={ordersLoading}
              loadingContent={<Spinner label="Memuat order..." />}
              emptyContent="Belum ada order"
            >
              {recentOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer"
                >
                  <TableCell className="py-4 text-label-md font-label-md text-primary">
                    {order.invoiceNumber}
                  </TableCell>
                  <TableCell className="py-4">
                    {order.customer?.name ?? "-"}
                  </TableCell>
                  <TableCell className="py-4">
                    {order.category?.name ?? "-"}
                  </TableCell>
                  <TableCell className="py-4 text-on-surface-variant">
                    {parseFloat(order.quantity)} {order.category?.unit ?? ""}
                  </TableCell>
                  <TableCell className="py-4">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={STATUS_COLORS[order.status] ?? "default"}
                    >
                      {order.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium">
                    Rp {Number(order.totalPrice).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </main>
  );
}
