import { useQuery, useMutation } from "@tanstack/react-query";
import { reportService } from "../services/report.service";

const REPORTS_KEY = ["reports"] as const;

/** Fetch dashboard stat cards (income, expenses, profit, etc.). */
export function useDashboardStats() {
  return useQuery({
    queryKey: [...REPORTS_KEY, "dashboard-stats"],
    queryFn: () => reportService.getDashboardStats(),
    refetchInterval: 60_000, // auto-refresh every 60 seconds
  });
}

/** Fetch financial trend data for the last N days. */
export function useFinancialTrend(period = 7) {
  return useQuery({
    queryKey: [...REPORTS_KEY, "financial-trend", period],
    queryFn: () => reportService.getFinancialTrend(period),
  });
}

/** Fetch the most recent orders (for dashboard table). */
export function useRecentOrders() {
  return useQuery({
    queryKey: [...REPORTS_KEY, "recent-orders"],
    queryFn: () => reportService.getRecentOrders(),
  });
}

/** Fetch orders with status FINISHED awaiting pickup. */
export function usePendingPickups() {
  return useQuery({
    queryKey: [...REPORTS_KEY, "pending-pickups"],
    queryFn: () => reportService.getPendingPickups(),
  });
}

/** Fetch report summary for a date range. */
export function useReportSummary(
  dateFrom: string | undefined,
  dateTo: string | undefined,
) {
  return useQuery({
    queryKey: [...REPORTS_KEY, "summary", dateFrom, dateTo],
    queryFn: () => reportService.getSummary(dateFrom!, dateTo!),
    enabled: !!dateFrom && !!dateTo,
  });
}

/** Download Excel report for a date range. Triggers a browser file download. */
export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      dateFrom,
      dateTo,
    }: {
      dateFrom: string;
      dateTo: string;
    }) => {
      const blob = await reportService.exportExcel(dateFrom, dateTo);
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${dateFrom}_${dateTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

/** Fetch category breakdown. */
export function useCategoryBreakdown(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, "category-breakdown", dateFrom, dateTo],
    queryFn: () => reportService.getCategoryBreakdown(dateFrom, dateTo),
  });
}

/** Fetch payment method breakdown. */
export function usePaymentBreakdown(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, "payment-breakdown", dateFrom, dateTo],
    queryFn: () => reportService.getPaymentBreakdown(dateFrom, dateTo),
  });
}

/** Fetch monthly comparison. */
export function useMonthlyComparison(months = 6) {
  return useQuery({
    queryKey: [...REPORTS_KEY, "monthly-comparison", months],
    queryFn: () => reportService.getMonthlyComparison(months),
  });
}
