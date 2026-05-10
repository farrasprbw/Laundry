import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseService } from "../services/expense.service";
import type { CreateExpenseInput, ListExpensesParams } from "../types/api";

const EXPENSES_KEY = ["expenses"] as const;

/** Fetch paginated expense list with optional filters. */
export function useExpenses(params?: ListExpensesParams) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, params],
    queryFn: () => expenseService.list(params),
  });
}

/** Fetch a single expense by ID. */
export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, id],
    queryFn: () => expenseService.getById(id!),
    enabled: !!id,
  });
}

/** Create a new expense. */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Update an existing expense. */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<CreateExpenseInput> & { id: string }) =>
      expenseService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

/** Delete an expense. */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
