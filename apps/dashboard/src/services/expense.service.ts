import apiClient from "../lib/api-client";
import type {
  Expense,
  CreateExpenseInput,
  ListExpensesParams,
  PaginatedResponse,
} from "../types/api";

/**
 * Expense API service — raw HTTP calls, no React dependencies.
 */
export const expenseService = {
  /** List expenses with optional filters / pagination. */
  async list(
    params?: ListExpensesParams,
  ): Promise<PaginatedResponse<Expense>> {
    const { data } = await apiClient.get<PaginatedResponse<Expense>>(
      "/expenses",
      { params },
    );
    return data;
  },

  /** Get a single expense by ID. */
  async getById(id: string): Promise<Expense> {
    const { data } = await apiClient.get<Expense>(`/expenses/${id}`);
    return data;
  },

  /** Create a new expense. */
  async create(input: CreateExpenseInput): Promise<Expense> {
    const { data } = await apiClient.post<Expense>("/expenses", input);
    return data;
  },

  /** Update an existing expense. */
  async update(
    id: string,
    input: Partial<CreateExpenseInput>,
  ): Promise<Expense> {
    const { data } = await apiClient.put<Expense>(`/expenses/${id}`, input);
    return data;
  },

  /** Soft-delete an expense. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
};
