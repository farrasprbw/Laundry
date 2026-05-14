import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentMethodService } from "../services/payment-method.service";
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from "../types/api";

const QUERY_KEY = ["payment-methods"];

/** List all payment methods. */
export function usePaymentMethods() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => paymentMethodService.list(),
  });
}

/** Create a new payment method. */
export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentMethodInput) =>
      paymentMethodService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/** Update a payment method. */
export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePaymentMethodInput & { id: string }) =>
      paymentMethodService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/** Delete a payment method. */
export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentMethodService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
