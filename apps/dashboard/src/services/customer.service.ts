import apiClient from "../lib/api-client";
import type {
  Customer,
  CreateCustomerInput,
  ListCustomersParams,
  PaginatedResponse,
} from "../types/api";

/**
 * Customer API service — raw HTTP calls, no React dependencies.
 */
export const customerService = {
  /** List customers with optional search / pagination. */
  async list(
    params?: ListCustomersParams,
  ): Promise<PaginatedResponse<Customer>> {
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(
      "/customers",
      { params },
    );
    return data;
  },

  /** Get a single customer by ID (includes orderCount). */
  async getById(id: string): Promise<Customer> {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },

  /** Create a new customer. */
  async create(input: CreateCustomerInput): Promise<Customer> {
    const { data } = await apiClient.post<Customer>("/customers", input);
    return data;
  },

  /** Update an existing customer. */
  async update(
    id: string,
    input: Partial<CreateCustomerInput>,
  ): Promise<Customer> {
    const { data } = await apiClient.put<Customer>(`/customers/${id}`, input);
    return data;
  },

  /** Soft-delete a customer. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
