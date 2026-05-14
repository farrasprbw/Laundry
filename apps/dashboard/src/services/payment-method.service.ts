import apiClient from "../lib/api-client";
import type { PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput } from "../types/api";

/**
 * Payment Method API service — raw HTTP calls, no React dependencies.
 */
export const paymentMethodService = {
  /** List all payment methods. */
  async list(): Promise<PaymentMethod[]> {
    const { data } = await apiClient.get<PaymentMethod[]>("/payment-methods");
    return data;
  },

  /** Get a single payment method by ID. */
  async getById(id: string): Promise<PaymentMethod> {
    const { data } = await apiClient.get<PaymentMethod>(`/payment-methods/${id}`);
    return data;
  },

  /** Create a new payment method. */
  async create(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const { data } = await apiClient.post<PaymentMethod>("/payment-methods", input);
    return data;
  },

  /** Update an existing payment method. */
  async update(
    id: string,
    input: UpdatePaymentMethodInput,
  ): Promise<PaymentMethod> {
    const { data } = await apiClient.put<PaymentMethod>(`/payment-methods/${id}`, input);
    return data;
  },

  /** Soft-delete a payment method. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/payment-methods/${id}`);
  },
};
