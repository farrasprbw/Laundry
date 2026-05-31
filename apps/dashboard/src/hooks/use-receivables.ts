import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { receivableService } from "../services/receivable.service";

export function useReceivableSummary() {
  return useQuery({
    queryKey: ["receivables", "summary"],
    queryFn: () => receivableService.getSummary(),
  });
}

export function useReceivableAging() {
  return useQuery({
    queryKey: ["receivables", "aging"],
    queryFn: () => receivableService.getAging(),
  });
}

export function useReceivablesByCustomer() {
  return useQuery({
    queryKey: ["receivables", "by-customer"],
    queryFn: () => receivableService.getByCustomer(),
  });
}

export function useReceivableOrders(customerId: string | null) {
  return useQuery({
    queryKey: ["receivables", "orders", customerId],
    queryFn: () => receivableService.getOrdersByCustomer(customerId!),
    enabled: !!customerId,
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerId: string) => receivableService.sendReminder(customerId),
    onSuccess: () => {
      // We might want to invalidate something if we track "last reminded at" in the future
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
    }
  });
}
