import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "../services/settings.service";
import type { UpdateSettingsInput } from "../types/api";

const SETTINGS_KEY = ["settings"] as const;
const PUBLIC_SETTINGS_KEY = ["public-settings"] as const;

/** Fetch all settings */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => settingsService.getAll(),
  });
}

/** Fetch public settings */
export function usePublicSettings() {
  return useQuery({
    queryKey: PUBLIC_SETTINGS_KEY,
    queryFn: () => settingsService.getPublic(),
  });
}

/** Update settings */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: UpdateSettingsInput) => settingsService.updateAll(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_KEY });
    },
  });
}
