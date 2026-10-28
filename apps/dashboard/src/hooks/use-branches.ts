import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import type { Branch } from "../types/api";

export const branchService = {
  async list(): Promise<Branch[]> {
    const { data } = await apiClient.get<Branch[]>("/branches");
    return data;
  },
};

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.list(),
  });
}
