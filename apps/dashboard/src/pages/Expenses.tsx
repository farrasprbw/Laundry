import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { 
  useExpenses, 
  useCreateExpense, 
  useUpdateExpense, 
  useDeleteExpense 
} from '../hooks/use-expenses';
import type { Expense } from '../types/api';

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
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d),
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense.mutateAsync(id);
    }
    setActiveMenu(null);
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

  const monthOptions = generateMonthOptions();
  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination;

  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop max-w-[1440px] w-full flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg text-on-surface">Expenses</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Track and manage facility operational costs.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container transition-all active:scale-[0.98] py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md h-[48px] md:h-[56px]"
        >
          <span className="material-symbols-outlined fill-icon">add</span>
          <span className="font-label-md text-label-md font-semibold">Add Expense</span>
        </button>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-surface border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline">search</span>
          </div>
          <input 
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface transition-colors placeholder:text-outline/70" 
            placeholder="Search expenses by description..." 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filters */}
        <div className="flex w-full lg:w-auto gap-3">
          <div className="relative flex-1 lg:w-48">
            <select 
              value={selectedMonthYear}
              onChange={(e) => {
                setSelectedMonthYear(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-surface-container-low border-none py-3 pl-4 pr-10 rounded-xl text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">All Months</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl overflow-visible relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-label-md font-label-md text-on-surface-variant">
                    <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Description</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
                  {expenses.map((expense) => {
                    const { date, time } = formatDate(expense.expenseDate);
                    const catDisplay = getCategoryDisplay(expense.category);
                    
                    return (
                      <tr key={expense.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-medium">{date}</div>
                          <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">{time}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm ${catDisplay.color}`}>
                            <span className="material-symbols-outlined text-[16px]">{catDisplay.icon}</span>
                            {catDisplay.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                          {expense.description || "-"}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right font-medium text-error">
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditModal(expense); }}
                              className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors" 
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                              className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors" 
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between rounded-b-2xl">
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
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
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Date *</label>
            <input 
              type="date" 
              value={formData.expenseDate}
              onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
              required
              disabled={isSubmitting}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Category *</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              disabled={isSubmitting}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Amount (IDR) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">Rp</span>
              <input 
                type="number" 
                placeholder="0" 
                step="1"
                min="0"
                required
                disabled={isSubmitting}
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-12 pr-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Description</label>
            <textarea 
              placeholder="Enter expense details" 
              rows={3}
              disabled={isSubmitting}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none disabled:opacity-50"
            ></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
}
