import apiClient from "../lib/api-client";
import type {
  Order,
  CreateOrderInput,
  ListOrdersParams,
  PaginatedResponse,
  WhatsAppLinkResult,
} from "../types/api";

/**
 * Order API service — raw HTTP calls, no React dependencies.
 */
export const orderService = {
  /** List orders with optional filters / pagination. */
  async list(params?: ListOrdersParams): Promise<PaginatedResponse<Order>> {
    const { data } = await apiClient.get<PaginatedResponse<Order>>("/orders", {
      params,
    });
    return data;
  },

  /** Get a single order by ID (includes joined customer & category). */
  async getById(id: string): Promise<Order> {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  /** Create a new order. */
  async create(input: CreateOrderInput): Promise<Order> {
    const { data } = await apiClient.post<Order>("/orders", input);
    return data;
  },

  /** Update order fields (notes, quantity, etc.). */
  async update(id: string, input: Partial<CreateOrderInput>): Promise<Order> {
    const { data } = await apiClient.put<Order>(`/orders/${id}`, input);
    return data;
  },

  /** Advance order status (PROCESS → FINISHED → TAKEN). */
  async updateStatus(id: string, status: string): Promise<Order> {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, {
      status,
    });
    return data;
  },

  /** Update payment status (UNPAID -> PAID). */
  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Order> {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/payment`, {
      paymentStatus,
    });
    return data;
  },

  /** Soft-delete an order. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },

  /** Generate a WhatsApp notification link for a finished order. */
  async getWhatsAppLink(id: string): Promise<WhatsAppLinkResult> {
    const { data } = await apiClient.get<WhatsAppLinkResult>(
      `/orders/${id}/wa-link`,
    );
    return data;
  },
};
