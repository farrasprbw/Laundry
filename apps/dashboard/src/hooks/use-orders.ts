import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import type { CreateOrderInput, ListOrdersParams } from "../types/api";

const ORDERS_KEY = ["orders"] as const;

/** Fetch paginated order list with optional filters. */
export function useOrders(params?: ListOrdersParams, refetchInterval?: number) {
  return useQuery({
    queryKey: [...ORDERS_KEY, params],
    queryFn: () => orderService.list(params),
    refetchInterval,
  });
}

/** Fetch a single order by ID (includes customer & category). */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDERS_KEY, id],
    queryFn: () => orderService.getById(id!),
    enabled: !!id,
  });
}

/** Create a new order. */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Update order fields. */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<CreateOrderInput> & { id: string }) =>
      orderService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

/** Advance order status (PROCESS → FINISHED → TAKEN). */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Update payment status (UNPAID → PAID). */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      orderService.updatePaymentStatus(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Delete an order. */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/**
 * Fetch a WhatsApp notification link for a given order.
 * Disabled by default — pass `enabled: true` or call `refetch()` to trigger.
 */
export function useWhatsAppLink(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDERS_KEY, id, "wa-link"],
    queryFn: () => orderService.getWhatsAppLink(id!),
    enabled: false, // on-demand only
  });
}
