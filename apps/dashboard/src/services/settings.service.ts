import apiClient from "../lib/api-client";
import type { StoreSettings, UpdateSettingsInput } from "../types/api";

export const settingsService = {
  /** Get all settings */
  async getAll(): Promise<StoreSettings> {
    const { data } = await apiClient.get<StoreSettings>("/settings");
    return data;
  },

  /** Get public settings (no auth required) */
  async getPublic(): Promise<Partial<StoreSettings>> {
    const { data } = await apiClient.get<Partial<StoreSettings>>("/public/settings");
    return data;
  },

  /** Update settings */
  async updateAll(settings: UpdateSettingsInput): Promise<StoreSettings> {
    const { data } = await apiClient.put<StoreSettings>("/settings", settings);
    return data;
  },
};
