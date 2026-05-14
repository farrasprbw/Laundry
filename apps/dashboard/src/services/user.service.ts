import apiClient from "../lib/api-client";
import type { UserInfo, CreateUserInput, UserRole } from "../types/api";

/**
 * User Management API service — raw HTTP calls, no React dependencies.
 */
export const userService = {
  /** List all users. */
  async list(): Promise<UserInfo[]> {
    const { data } = await apiClient.get<UserInfo[]>("/users");
    return data;
  },

  /** Get a single user by ID. */
  async getById(id: string): Promise<UserInfo> {
    const { data } = await apiClient.get<UserInfo>(`/users/${id}`);
    return data;
  },

  /** Create a new user. */
  async create(input: CreateUserInput): Promise<UserInfo> {
    const { data } = await apiClient.post<UserInfo>("/users", input);
    return data;
  },

  /** Update user role. */
  async updateRole(id: string, role: UserRole): Promise<UserInfo> {
    const { data } = await apiClient.patch<UserInfo>(`/users/${id}/role`, { role });
    return data;
  },

  /** Update user profile. */
  async update(id: string, input: { name?: string; email?: string }): Promise<UserInfo> {
    const { data } = await apiClient.put<UserInfo>(`/users/${id}`, input);
    return data;
  },

  /** Delete a user. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
