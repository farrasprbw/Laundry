import apiClient from "../lib/api-client";
import type {
  DashboardStats,
  FinancialTrendDay,
  Order,
  ReportSummary,
} from "../types/api";

/**
 * Report API service — raw HTTP calls, no React dependencies.
 */
export const reportService = {
  /** Get dashboard stat cards (today's income, expenses, profit, etc.). */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>(
      "/reports/dashboard-stats",
    );
    return data;
  },

  /** Get financial trend data for the last N days. */
  async getFinancialTrend(period = 7): Promise<FinancialTrendDay[]> {
    const { data } = await apiClient.get<FinancialTrendDay[]>(
      "/reports/financial-trend",
      { params: { period } },
    );
    return data;
  },

  /** Get the 5 most recent orders (for dashboard table). */
  async getRecentOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/reports/recent-orders");
    return data;
  },

  /** Get orders with status FINISHED awaiting pickup. */
  async getPendingPickups(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/reports/pending-pickups");
    return data;
  },

  /** Get report summary for a date range. */
  async getSummary(dateFrom: string, dateTo: string): Promise<ReportSummary> {
    const { data } = await apiClient.get<ReportSummary>("/reports/summary", {
      params: { dateFrom, dateTo },
    });
    return data;
  },

  /** Download an Excel report as a Blob. */
  async exportExcel(dateFrom: string, dateTo: string): Promise<Blob> {
    const { data } = await apiClient.get("/reports/export", {
      params: { dateFrom, dateTo },
      responseType: "blob",
    });
    return data;
  },
};
