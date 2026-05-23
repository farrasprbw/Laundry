// ============================================================
// Shared TypeScript types mirroring the backend DB schema
// and API response shapes
// ============================================================

// ── Entity Types ──

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  orderCount?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  pricePerUnit: number;
  unit: string; // kg | pcs | unit
  estimatedDurationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerId: string;
  categoryId: string;
  createdById: string;
  quantity: string; // numeric stored as string
  totalPrice: number;
  status: "PROCESS" | "FINISHED" | "TAKEN";
  paymentStatus: "UNPAID" | "PAID";
  paymentMethodId: string | null;
  notes: string | null;
  discount: number;
  parfume: string | null;
  finishedAt: string | null;
  takenAt: string | null;
  waNotificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    unit: string;
    estimatedDurationDays?: number;
  } | null;
  paymentMethod?: {
    id: string;
    name: string;
  } | null;
}

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── Pagination ──

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ── Report Types ──

export interface DashboardStats {
  todayIncome: number;
  todayExpenses: number;
  todayProfit: number;
  todayOrderCount: number;
  pendingPickups: number;
  monthlyIncome: number;
}

export interface FinancialTrendDay {
  date: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface WhatsAppLinkResult {
  waLink: string;
  message: string;
  phone: string;
}

// ── Query Param Types ──

export interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

export interface ListOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListExpensesParams {
  month?: number;
  year?: number;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Mutation Input Types ──

export interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  pricePerUnit: number;
  unit: string;
  estimatedDurationDays: number;
}

export interface CreateOrderInput {
  customerId: string;
  categoryId: string;
  quantity: number;
  notes?: string;
  paymentMethodId?: string;
  paymentStatus?: "UNPAID" | "PAID";
  discount?: number;
  parfume?: string;
}

export interface CreateExpenseInput {
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
}

// ── Payment Method Types ──

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePaymentMethodInput {
  name: string;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  isActive?: boolean;
}

// ── User Management Types ──

export type UserRole = "super_admin" | "admin" | "worker";

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
  phone?: string;
  password: string;
  role: UserRole;
}

// ── Dashboard Types ──

export interface DashboardRecentOrder {
  id: string;
  invoiceNumber: string;
  quantity: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  category: {
    id: string;
    name: string;
    unit: string;
  } | null;
}

// ── API Error ──

export interface ApiError {
  error: string;
  message?: string;
}
