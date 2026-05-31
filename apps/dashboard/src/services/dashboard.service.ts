import apiClient from "../lib/api-client";
import type { DashboardStats, FinancialTrendDay, DashboardRecentOrder, DashboardAnalytics } from "../types/api";

/**
 * Dashboard API service — raw HTTP calls, no React dependencies.
 */
export const dashboardService = {
  /** Get dashboard stats. */
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },

  /** Get recent orders. */
  async getRecentOrders(limit = 5): Promise<DashboardRecentOrder[]> {
    const { data } = await apiClient.get<DashboardRecentOrder[]>("/dashboard/recent-orders", {
      params: { limit },
    });
    return data;
  },

  /** Get financial trend for last N days. */
  async getFinancialTrend(days = 7): Promise<FinancialTrendDay[]> {
    const { data } = await apiClient.get<FinancialTrendDay[]>("/dashboard/financial-trend", {
      params: { days },
    });
    return data;
  },

  /** Get deep dashboard analytics. */
  async getAnalytics(): Promise<DashboardAnalytics> {
    const { data } = await apiClient.get<DashboardAnalytics>("/dashboard/analytics");
    return data;
  },
};
