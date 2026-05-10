import apiClient from "../lib/api-client";
import type { Category, CreateCategoryInput } from "../types/api";

/**
 * Category API service — raw HTTP calls, no React dependencies.
 */
export const categoryService = {
  /** List all active categories. */
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },

  /** Get a single category by ID. */
  async getById(id: string): Promise<Category> {
    const { data } = await apiClient.get<Category>(`/categories/${id}`);
    return data;
  },

  /** Create a new category. */
  async create(input: CreateCategoryInput): Promise<Category> {
    const { data } = await apiClient.post<Category>("/categories", input);
    return data;
  },

  /** Update an existing category. */
  async update(
    id: string,
    input: Partial<CreateCategoryInput>,
  ): Promise<Category> {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, input);
    return data;
  },

  /** Soft-delete a category. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
