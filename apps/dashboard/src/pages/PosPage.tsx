import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  RotateCcw,
  Banknote,
  QrCode,
  Clock,
  Shirt,
  ArrowDownCircle,
} from 'lucide-react';
import { useCategories } from '../hooks/use-categories';
import { useCustomers, useCreateCustomer } from '../hooks/use-customers';
import { usePaymentMethods } from '../hooks/use-payment-methods';
import { useCreateOrder } from '../hooks/use-orders';
import { useAlert } from '../contexts/AlertContext';
import type { Category, Customer, Order } from '../types/api';
import { buildLaundryReceipt, type StoreConfig } from '../utils/receipt-builder';

const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'CleanFold Laundry',
  address: 'Jl. Raya Laundry No. 1',
  phone: '0812-3456-7890',
  disclaimer: ['Terima kasih atas kepercayaan Anda!'],
  qrCodeUrl: '',
};

interface CartItem {
  category: Category;
  quantity: number;
  unit: string;
  notes: string;
}

const PAGE_SIZE = 6;

export function PosPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Data Queries
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: customerResponse, isLoading: loadingCust } = useCustomers({ limit: 100 });
  const customers: Customer[] = useMemo(() => customerResponse?.data || [], [customerResponse]);

  const { data: paymentMethods = [] } = usePaymentMethods();
  const createOrder = useCreateOrder();
  const createCustomer = useCreateCustomer();

  // POS Flow State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // New Customer Modal
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Items & Cart
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [searchCategory, setSearchCategory] = useState('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment & Checkout
  // Options: 'unpaid' (Bayar Nanti), 'cash' (Tunai), 'qris' (QRIS)
  const [paymentChoice, setPaymentChoice] = useState<'cash' | 'qris' | 'unpaid'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [notes, setNotes] = useState('');

  // Success State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Customer detail
  const selectedCustomer = useMemo(() => {
    return customers.find((c: Customer) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c: Customer) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (selectedCategoryTab === 'kiloan') {
      list = list.filter((c: Category) => c.unit.toLowerCase() === 'kg');
    } else if (selectedCategoryTab === 'satuan') {
      list = list.filter((c: Category) => c.unit.toLowerCase() !== 'kg');
    }
    if (searchCategory.trim()) {
      const q = searchCategory.toLowerCase();
      list = list.filter((c: Category) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [categories, selectedCategoryTab, searchCategory]);

  // Lazy/Paged Categories
  const displayedCategories = useMemo(() => {
    return filteredCategories.slice(0, visibleCount);
  }, [filteredCategories, visibleCount]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.category.pricePerUnit, 0);
  }, [cart]);

  let pointsDiscount = 0;
  let pointsToUse = 0;
  if (usePoints && selectedCustomer?.points) {
    pointsToUse = Math.min(selectedCustomer.points, subtotal);
    pointsDiscount = pointsToUse;
  }

  const grandTotal = Math.max(0, subtotal - pointsDiscount);
  const change = Math.max(0, cashGiven - grandTotal);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Find matching payment method ID from backend list
  const resolvedPaymentMethodId = useMemo(() => {
    if (paymentChoice === 'unpaid') return null;
    const targetName = paymentChoice === 'cash' ? 'cash' : 'qris';
    const found = paymentMethods.find((pm) =>
      pm.name.toLowerCase().includes(targetName) ||
      (targetName === 'cash' && pm.name.toLowerCase().includes('tunai'))
    );
    return found ? found.id : (paymentMethods[0]?.id || null);
  }, [paymentChoice, paymentMethods]);

  // Cart Handlers
  const handleAddToCart = (category: Category) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.category.id === category.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const step = category.unit.toLowerCase() === 'kg' ? 0.5 : 1;
        updated[existingIndex].quantity = parseFloat(
          (updated[existingIndex].quantity + step).toFixed(2)
        );
        return updated;
      }
      return [
        ...prev,
        {
          category,
          quantity: 1,
          unit: category.unit,
          notes: '',
        },
      ];
    });
  };

  const handleAdjustQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = Math.max(0, parseFloat((item.quantity + delta).toFixed(2)));
      if (newQty === 0) {
        return updated.filter((_, i) => i !== index);
      }
      item.quantity = newQty;
      return updated;
    });
  };

  const handleDirectQuantityChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setCart((prev) => {
      const updated = [...prev];
      if (isNaN(num) || num <= 0) {
        updated[index].quantity = 0;
      } else {
        updated[index].quantity = num;
      }
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = await createCustomer.mutateAsync({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '-',
        address: newCustAddress.trim() || undefined,
      });
      setSelectedCustomerId(created.id);
      setCustomerSearch(created.name);
      setShowNewCustModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      showAlert('Pelanggan berhasil ditambahkan!', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showAlert(error.response?.data?.message || 'Gagal membuat pelanggan baru', 'danger');
    }
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      showAlert('Mohon pilih atau buat nama pelanggan terlebih dahulu!', 'warning');
      return;
    }
    if (cart.length === 0) {
      showAlert('Keranjang masih kosong, pilih layanan terlebih dahulu!', 'warning');
      return;
    }
    if (cart.some((i) => i.quantity <= 0)) {
      showAlert('Jumlah/berat cucian harus lebih dari 0!', 'warning');
      return;
    }
    if (paymentChoice === 'cash' && cashGiven < grandTotal) {
      showAlert('Uang tunai yang diterima kurang dari total tagihan!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payStatus = paymentChoice === 'unpaid' ? ('UNPAID' as const) : ('PAID' as const);
      const newOrder = await createOrder.mutateAsync({
        customerId: selectedCustomerId,
        items: cart.map((i) => ({
          categoryId: i.category.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        paymentMethodId: resolvedPaymentMethodId || undefined,
        paymentStatus: payStatus,
        notes: notes || undefined,
      });

      setCompletedOrder(newOrder);
      showAlert('Transaksi pesanan berhasil disimpan!', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showAlert(error.response?.data?.message || 'Gagal menyimpan transaksi', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!completedOrder) return;
    try {
      const receiptData = {
        invoiceNumber: completedOrder.invoiceNumber,
        customerName: completedOrder.customer?.name || selectedCustomer?.name || 'Pelanggan',
        items: cart.map((i) => ({
          categoryName: i.category.name,
          quantity: i.quantity,
          unit: i.unit,
          pricePerUnit: i.category.pricePerUnit,
          subtotal: i.quantity * i.category.pricePerUnit,
        })),
        totalPrice: grandTotal,
        discount: pointsDiscount,
        paymentStatus: completedOrder.paymentStatus,
        createdAt: completedOrder.createdAt || new Date().toISOString(),
        notes: notes || null,
      };

      const commands = buildLaundryReceipt(receiptData, DEFAULT_STORE_CONFIG);
      showAlert(`Struk berhasil dibuat (${commands.length} bytes)! Siap cetak ke printer thermal.`, 'success');
      window.print();
    } catch {
      showAlert('Format cetak siap dikirim ke thermal printer Bluetooth 58mm', 'primary');
    }
  };

  const handleResetPos = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomerSearch('');
    setPaymentChoice('cash');
    setCashGiven(0);
    setUsePoints(false);
    setNotes('');
    setCompletedOrder(null);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Clean Top Navigation Bar — Not cut off */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Kembali ke Pesanan"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-600 inline-block"></span>
              Kasir Laundry (POS)
            </h1>
            <p className="text-xs text-slate-500 font-medium">Mode Transaksi Cepat & Ramah Sentuh</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPos}
            className="px-4 py-2 text-xs md:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Transaksi Baru
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-sm transition-all"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Selection & Services Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Selection Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full">
                Langkah 1 • Data Pelanggan
              </span>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomerId('');
                    setCustomerSearch('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Ganti Pelanggan
                </button>
              )}
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik Nama atau No. WA Pelanggan..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full pl-12 pr-4 py-3.5 text-base font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowNewCustModal(true)}
                  className="px-4 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all flex-shrink-0 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Baru</span>
                </button>
              </div>

              {/* Dropdown Suggestions */}
              {isCustomerDropdownOpen && !selectedCustomer && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {loadingCust ? (
                    <div className="p-4 text-center text-sm text-slate-500 font-medium">Memuat data pelanggan...</div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-600 font-medium mb-2">Pelanggan tidak ditemukan</p>
                      <button
                        onClick={() => {
                          setNewCustName(customerSearch);
                          setShowNewCustModal(true);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg"
                      >
                        + Tambah "{customerSearch}" Sebagai Pelanggan Baru
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map((c: Customer) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch(c.name);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-cyan-50/60 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-base">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone || 'Tanpa No. HP'}</p>
                        </div>
                        {c.points && c.points > 0 ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            {c.points} Poin
                          </span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-cyan-950">{selectedCustomer.name}</p>
                  <p className="text-xs text-cyan-800">{selectedCustomer.phone || 'No HP Belum ada'} • {selectedCustomer.address || 'Alamat Belum ada'}</p>
                </div>
                {selectedCustomer.points && selectedCustomer.points > 0 ? (
                  <div className="text-right">
                    <p className="text-xs text-cyan-700 font-semibold">Poin Tersedia</p>
                    <p className="text-sm font-black text-cyan-900">{selectedCustomer.points} Poin</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 2. Service Catalog Card with Lazy Load & Filter */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full">
                Langkah 2 • Pilih Layanan Laundry
              </span>
              
              {/* Filter Tabs */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => { setSelectedCategoryTab('all'); setVisibleCount(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategoryTab === 'all'
                      ? 'bg-cyan-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => { setSelectedCategoryTab('kiloan'); setVisibleCount(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategoryTab === 'kiloan'
                      ? 'bg-cyan-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kiloan
                </button>
                <button
                  onClick={() => { setSelectedCategoryTab('satuan'); setVisibleCount(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategoryTab === 'satuan'
                      ? 'bg-cyan-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satuan
                </button>
              </div>
            </div>

            {/* Search within Category */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama layanan (misal: Komplit, Setrika, Bedcover)..."
                value={searchCategory}
                onChange={(e) => { setSearchCategory(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-all"
              />
            </div>

            {/* Service Grid */}
            {loadingCats ? (
              <div className="py-12 text-center text-slate-400 font-medium">Memuat daftar layanan...</div>
            ) : displayedCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">Layanan tidak ditemukan</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayedCategories.map((cat: Category) => {
                  const inCartItem = cart.find((i) => i.category.id === cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleAddToCart(cat)}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                        inCartItem
                          ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-600/20'
                          : 'border-slate-200 hover:border-cyan-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-black text-slate-900 text-base group-hover:text-cyan-800 transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {cat.description || 'Layanan laundry standar'}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase flex-shrink-0">
                          /{cat.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-lg font-black text-cyan-800">
                          {formatRupiah(cat.pricePerUnit)}
                        </span>
                        {inCartItem ? (
                          <span className="text-xs font-black text-white bg-cyan-700 px-2.5 py-1 rounded-lg">
                            ✓ {inCartItem.quantity} {inCartItem.unit}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-cyan-700 group-hover:underline">
                            + Tambah
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Lazy Load Button: Load More */}
            {visibleCount < filteredCategories.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Tampilkan Layanan Lainnya ({filteredCategories.length - visibleCount} tersisa)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart, Weight Shortcuts & Simple 3-Choice Payment (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full">
                Langkah 3 • Keranjang & Bayar
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium space-y-2">
                <Shirt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">Keranjang masih kosong</p>
                <p className="text-xs text-slate-400">Klik layanan di sebelah kiri untuk menambahkan</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div key={item.category.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.category.name}</h4>
                        <p className="text-xs text-slate-500">
                          {formatRupiah(item.category.pricePerUnit)} / {item.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">
                          {formatRupiah(item.quantity * item.category.pricePerUnit)}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Quick Weight Helper */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustQuantity(idx, item.unit.toLowerCase() === 'kg' ? -0.5 : -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shadow-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleDirectQuantityChange(idx, e.target.value)}
                          className="w-16 h-8 text-center text-sm font-black bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjustQuantity(idx, item.unit.toLowerCase() === 'kg' ? 0.5 : 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold text-slate-500 pl-1">{item.unit}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loyalty Points checkbox */}
            {selectedCustomer && selectedCustomer.points && selectedCustomer.points > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="usePointsCheck"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300"
                  />
                  <label htmlFor="usePointsCheck" className="text-xs font-bold text-emerald-900 cursor-pointer">
                    Gunakan {pointsToUse} Poin Loyalitas
                  </label>
                </div>
                <span className="text-xs font-black text-emerald-700">-{formatRupiah(pointsDiscount)}</span>
              </div>
            ) : null}

            {/* Simple Clean 3 Payment Choices: Cash, QRIS, Unpaid */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('cash')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentChoice === 'cash'
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs font-black">Tunai / Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('qris')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentChoice === 'qris'
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs font-black">QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('unpaid')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentChoice === 'unpaid'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-xs font-black">Belum Bayar</span>
                </button>
              </div>
            </div>

            {/* Cash Shortcuts if Cash selected */}
            {paymentChoice === 'cash' && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Uang Diterima:</span>
                  <span className="font-black text-cyan-800 text-sm">{formatRupiah(cashGiven)}</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCashGiven(grandTotal)}
                    className="py-2 px-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(20000)}
                    className="py-2 px-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300"
                  >
                    20rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(50000)}
                    className="py-2 px-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300"
                  >
                    50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(100000)}
                    className="py-2 px-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300"
                  >
                    100rb
                  </button>
                </div>

                {cashGiven > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs font-black">
                    <span className="text-slate-600">Kembalian:</span>
                    <span className={`text-sm ${
                      change >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                    >
                      {change >= 0 ? formatRupiah(change) : `Kurang ${formatRupiah(Math.abs(change))}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Summary & Checkout Button */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Pembayaran</span>
                <span className="text-2xl font-black text-slate-900">{formatRupiah(grandTotal)}</span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || cart.length === 0 || !selectedCustomerId}
                onClick={handleCheckout}
                className={`w-full py-4 px-6 rounded-xl font-black text-base shadow-sm flex items-center justify-center gap-2 transition-all ${
                  isSubmitting || cart.length === 0 || !selectedCustomerId
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-700 hover:bg-cyan-800 text-white shadow-cyan-900/10'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'Simpan & Cetak Struk'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Pelanggan Baru */}
      {showNewCustModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Tambah Pelanggan Baru</h3>
              <button
                onClick={() => setShowNewCustModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pelanggan..."
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  placeholder="0812xxxx (opsional)..."
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Alamat / patokan (opsional)..."
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending}
                  className="flex-1 py-2.5 text-sm font-black text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-sm transition-all"
                >
                  {createCustomer.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transaksi Berhasil & Print Struk */}
      {completedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">{completedOrder.invoiceNumber}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Pelanggan:</span>
                <span className="font-bold text-slate-800">{selectedCustomer?.name || 'Pelanggan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Bayar:</span>
                <span className="font-black text-slate-900">{formatRupiah(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status Bayar:</span>
                <span className={`font-bold uppercase ${
                  completedOrder.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-600'
                }`}
                >
                  {completedOrder.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full py-3.5 px-4 bg-cyan-700 hover:bg-cyan-800 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Thermal</span>
              </button>

              <button
                type="button"
                onClick={handleResetPos}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
              >
                Selesai / Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
