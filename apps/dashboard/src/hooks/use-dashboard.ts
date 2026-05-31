import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

/** Fetch dashboard summary stats. */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60_000, // auto-refresh every 60s
  });
}

/** Fetch recent orders for the dashboard. */
export function useDashboardRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recent-orders", limit],
    queryFn: () => dashboardService.getRecentOrders(limit),
    refetchInterval: 60_000,
  });
}

/** Fetch financial trend data. */
export function useDashboardFinancialTrend(days = 7) {
  return useQuery({
    queryKey: ["dashboard", "financial-trend", days],
    queryFn: () => dashboardService.getFinancialTrend(days),
    refetchInterval: 60_000,
  });
}

/** Fetch deep dashboard analytics. */
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: () => dashboardService.getAnalytics(),
    refetchInterval: 60_000,
  });
}
