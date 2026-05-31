import apiClient from "../lib/api-client";
import type { ReceivableSummary, AgingBucket, CustomerReceivable, Order } from "../types/api";

export const receivableService = {
  /** Get receivables summary */
  async getSummary(): Promise<ReceivableSummary> {
    const { data } = await apiClient.get<ReceivableSummary>("/receivables/summary");
    return data;
  },

  /** Get receivables aging analysis */
  async getAging(): Promise<AgingBucket[]> {
    const { data } = await apiClient.get<AgingBucket[]>("/receivables/aging");
    return data;
  },

  /** Get receivables by customer */
  async getByCustomer(): Promise<CustomerReceivable[]> {
    const { data } = await apiClient.get<CustomerReceivable[]>("/receivables/by-customer");
    return data;
  },

  /** Get UNPAID orders for a specific customer */
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>(`/receivables/by-customer/${customerId}/orders`);
    return data;
  },

  /** Send WhatsApp reminder to customer */
  async sendReminder(customerId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`/receivables/reminder/${customerId}`);
    return data;
  },
};
