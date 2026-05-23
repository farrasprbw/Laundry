import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense
} from '../hooks/use-expenses';
import type { Expense } from '../types/api';
import { Button, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner, Pagination, Tooltip, Textarea } from '@nextui-org/react';

const CATEGORIES = [
  { value: "detergent", label: "Detergent & Supplies", icon: "water_drop", color: "bg-primary-fixed-dim/30 text-on-primary-fixed-variant" },
  { value: "electricity", label: "Electricity", icon: "bolt", color: "bg-surface-container-highest text-on-surface" },
  { value: "water", label: "Water", icon: "water_damage", color: "bg-secondary-fixed/50 text-on-secondary-fixed-variant" },
  { value: "maintenance", label: "Maintenance", icon: "build", color: "bg-error-container/50 text-on-error-container" },
  { value: "rent", label: "Rent", icon: "store", color: "bg-tertiary-fixed/50 text-on-tertiary-fixed-variant" },
  { value: "other", label: "Other", icon: "receipt_long", color: "bg-surface-variant text-on-surface-variant" },
];

const getCategoryDisplay = (val: string) => {
  return CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    date: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(d)
  };
};

const generateMonthOptions = () => {
  const options = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
    const value = `${month}-${year}`;
    options.push({ label, value });
  }
  return options;
};

export function Expenses() {
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [confirmState, setConfirmState] = useState<{ open: boolean, data: string | null }>({ open: false, data: null });
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("");
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [monthStr, yearStr] = selectedMonthYear ? selectedMonthYear.split("-") : [undefined, undefined];

  // API Hooks
  const { data: expensesData, isLoading } = useExpenses({
    page,
    limit,
    search: debouncedSearch,
    month: monthStr ? parseInt(monthStr, 10) : undefined,
    year: yearStr ? parseInt(yearStr, 10) : undefined,
  });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    category: "detergent",
    amount: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actions Menu State
  const [_activeMenu, setActiveMenu] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      expenseDate: new Date().toISOString().split("T")[0],
      category: "detergent",
      amount: "",
      description: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseDate: expense.expenseDate.split("T")[0],
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description || ""
    });
    setActiveMenu(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmState({ open: true, data: id });
    setActiveMenu(null);
  };

  const onConfirmDelete = async () => {
    if (!confirmState.data) return;
    try {
      await deleteExpense.mutateAsync(confirmState.data);
      setConfirmState({ open: false, data: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.expenseDate || !formData.category) return;

    setIsSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate).toISOString(),
        description: formData.description || undefined
      };

      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, ...payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Failed to save expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const monthOptions = [{ label: "All Months", value: "" }, ...generateMonthOptions()];
  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination;

  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop w-full flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg text-on-surface">Expenses</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Track and manage facility operational costs.</p>
        </div>
        <Button
          color="primary"
          onPress={openAddModal}
          className="w-full md:w-auto font-semibold px-6 py-7 rounded-xl shadow-sm text-label-md text-white"
          startContent={<span className="material-symbols-outlined">add</span>}
        >
          Add Expense
        </Button>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-surface border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <Input
          className="w-full lg:w-96"
          placeholder="Search expenses by description..."
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<span className="material-symbols-outlined text-outline mr-1 text-[20px]">search</span>}
          variant="bordered"
        />
        {/* Filters */}
        <div className="flex w-full lg:w-auto gap-3">
          <Select
            aria-label="Filter Bulan"
            placeholder="All Months"
            selectedKeys={selectedMonthYear ? [selectedMonthYear] : []}
            onChange={(e) => {
              setSelectedMonthYear(e.target.value);
              setPage(1);
            }}
            className="w-full lg:w-48"
            variant="bordered"
            size="sm"
          >
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Data Table Card */}
      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6 relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10 rounded-2xl">
            <Spinner label="Memuat data..." />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-4 rounded-2xl">
            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">receipt_long</span>
            <h3 className="text-title-lg font-title-lg text-on-surface mb-2">No Expenses Found</h3>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-md">
              {search || selectedMonthYear ? "Try adjusting your search or filters to find what you're looking for." : "You haven't recorded any expenses yet. Click 'Add Expense' to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <Table aria-label="Expenses Table" removeWrapper shadow="none" className="min-w-max w-full">
              <TableHeader>
                <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Date</TableColumn>
                <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Category</TableColumn>
                <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Description</TableColumn>
                <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</TableColumn>
                <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</TableColumn>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const { date, time } = formatDate(expense.expenseDate);
                  const catDisplay = getCategoryDisplay(expense.category);

                  return (
                    <TableRow key={expense.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{date}</div>
                        <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">{time}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            expense.category === 'detergent' ? 'primary' :
                              expense.category === 'electricity' ? 'default' :
                                expense.category === 'water' ? 'secondary' :
                                  expense.category === 'maintenance' ? 'danger' :
                                    expense.category === 'rent' ? 'warning' : 'default'
                          }
                          startContent={<span className="material-symbols-outlined text-[16px] mr-1">{catDisplay.icon}</span>}
                        >
                          {catDisplay.label}
                        </Chip>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium text-error">
                        -{formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip content="Edit">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEditModal(expense)}
                              className="text-outline hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </Button>
                          </Tooltip>
                          <Tooltip content="Delete">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleDelete(expense.id)}
                              disabled={deleteExpense.isPending}
                              className="text-outline hover:text-error"
                            >
                              <span className={deleteExpense.isPending && deleteExpense.variables === expense.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                                {deleteExpense.isPending && deleteExpense.variables === expense.id ? 'progress_activity' : 'delete'}
                              </span>
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-4">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                </span>
                <Pagination
                  total={pagination.totalPages}
                  page={page}
                  onChange={(newPage) => setPage(newPage)}
                  size="sm"
                  variant="flat"
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isSubmitDisabled={isSubmitting}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="date"
            label="Date *"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            isRequired
            isDisabled={isSubmitting}
            variant="bordered"
          />

          <Select
            label="Category *"
            selectedKeys={formData.category ? [formData.category] : []}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            isDisabled={isSubmitting}
            variant="bordered"
          >
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </Select>

          <Input
            type="number"
            label="Amount (IDR) *"
            placeholder="0"
            step="1"
            min="0"
            isRequired
            isDisabled={isSubmitting}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            variant="bordered"
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">Rp</span>
              </div>
            }
          />

          <Textarea
            label="Description"
            placeholder="Enter expense details"
            disabled={isSubmitting}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            variant="bordered"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, data: null })}
        onConfirm={onConfirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
