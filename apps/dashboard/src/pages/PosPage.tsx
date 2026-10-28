import { useState, useMemo, useEffect, useRef } from 'react';
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
  X,
  UserCheck,
} from 'lucide-react';
import { useCategories } from '../hooks/use-categories';
import { useCustomers, useCreateCustomer } from '../hooks/use-customers';
import { usePaymentMethods } from '../hooks/use-payment-methods';
import { useCreateOrder } from '../hooks/use-orders';
import { useAlert } from '../contexts/AlertContext';
import type { Category, Customer, Order } from '../types/api';
import {
  formatRupiah,
  type ReceiptData,
  type StoreConfig,
  printReceiptRaw,
} from '../utils/receipt-builder';

interface CartItem {
  category: Category;
  quantity: number;
  notes: string;
}

const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'CleanFold Laundry',
  address: 'Jl. Raya Laundry No. 1',
  phone: '0812-3456-7890',
  disclaimer: ['Terima kasih atas kepercayaan Anda!'],
  qrCodeUrl: '',
};

export function PosPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Data Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
  const { data: paymentMethods = [] } = usePaymentMethods();
  const createOrder = useCreateOrder();
  const createCustomer = useCreateCustomer();

  const customers: Customer[] = useMemo(() => {
    if (!customersData) return [];
    if (Array.isArray(customersData)) return customersData;
    if ('data' in customersData && Array.isArray((customersData as any).data)) {
      return (customersData as any).data;
    }
    return [];
  }, [customersData]);

  // POS Operational States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Quick New Customer Modal State
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Cart & Tab Filters
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'kiloan' | 'satuan'>('all');
  const [searchItemQuery, setSearchItemQuery] = useState('');

  // Simple 3 Payment Choices
  const [paymentChoice, setPaymentChoice] = useState<'unpaid' | 'cash' | 'qris'>('unpaid');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Success & Receipt States
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto select default customer (Umum) if available
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      const umumCust = customers.find((c) => c.name.toLowerCase().includes('umum'));
      if (umumCust) {
        setSelectedCustomerId(umumCust.id);
      } else if (customers[0]) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [customers, selectedCustomerId]);

  // Auto select default payment method when choice changes
  useEffect(() => {
    if (paymentChoice === 'cash') {
      const cashMethod = paymentMethods.find((m) => m.type === 'CASH');
      if (cashMethod) setSelectedPaymentMethodId(cashMethod.id);
      else if (paymentMethods[0]) setSelectedPaymentMethodId(paymentMethods[0].id);
    } else if (paymentChoice === 'qris') {
      const qrisMethod = paymentMethods.find((m) => m.type === 'QRIS' || m.type === 'TRANSFER');
      if (qrisMethod) setSelectedPaymentMethodId(qrisMethod.id);
      else if (paymentMethods[0]) setSelectedPaymentMethodId(paymentMethods[0].id);
    } else {
      setSelectedPaymentMethodId('');
    }
  }, [paymentChoice, paymentMethods]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    ).slice(0, 8);
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered Catalog Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchTab =
        selectedCategoryTab === 'all' ||
        (selectedCategoryTab === 'kiloan' && c.unit === 'KG') ||
        (selectedCategoryTab === 'satuan' && c.unit === 'PCS');
      const matchSearch =
        !searchItemQuery.trim() ||
        c.name.toLowerCase().includes(searchItemQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [categories, selectedCategoryTab, searchItemQuery]);

  // Helper map: id -> quantity currently in cart
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.category.id, item.quantity);
    });
    return map;
  }, [cart]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.category.basePrice * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Manipulations
  const handleAddToCart = (category: Category) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.category.id === category.id);
      const defaultStep = category.unit === 'KG' ? 1 : 1;
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: Number((updated[idx].quantity + defaultStep).toFixed(2)),
        };
        return updated;
      }
      return [...prev, { category, quantity: defaultStep, notes: '' }];
    });
  };

  const handleMinusFromCart = (categoryId: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.category.id === categoryId);
      if (idx === -1) return prev;
      const item = prev[idx];
      const step = item.category.unit === 'KG' ? 1 : 1;
      const newQty = Number((item.quantity - step).toFixed(2));
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      const updated = [...prev];
      updated[idx] = { ...item, quantity: newQty };
      return updated;
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Number(newQty.toFixed(2)) };
      return updated;
    });
  };

  const handleQuickAddWeight = (index: number, additionalWeight: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const current = updated[index].quantity;
      updated[index] = {
        ...updated[index],
        quantity: Number((current + additionalWeight).toFixed(2)),
      };
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showAlert('warning', 'Nama pelanggan wajib diisi');
      return;
    }
    try {
      const created = await createCustomer.mutateAsync({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '-',
        address: newCustAddress.trim() || undefined,
      });
      setSelectedCustomerId(created.id);
      setShowNewCustModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setIsCustomerDropdownOpen(false);
      showAlert('success', `Pelanggan ${created.name} berhasil dibuat & dipilih!`);
    } catch (err: any) {
      showAlert('error', err?.response?.data?.message || 'Gagal menambahkan pelanggan');
    }
  };

  const handleResetPos = () => {
    setCart([]);
    setOrderNotes('');
    setPaymentChoice('unpaid');
    setCompletedOrder(null);
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      showAlert('warning', 'Pilih atau cari pelanggan terlebih dahulu');
      return;
    }
    if (cart.length === 0) {
      showAlert('warning', 'Keranjang masih kosong, pilih layanan cucian');
      return;
    }

    setIsSubmitting(true);
    try {
      const payStatus = paymentChoice === 'unpaid' ? ('UNPAID' as const) : ('PAID' as const);
      const payload = {
        customerId: selectedCustomerId,
        items: cart.map((item) => ({
          categoryId: item.category.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
        notes: orderNotes.trim() || undefined,
        paymentStatus: payStatus,
        paymentMethodId:
          paymentChoice !== 'unpaid' && selectedPaymentMethodId
            ? selectedPaymentMethodId
            : undefined,
      };

      const res = await createOrder.mutateAsync(payload as any);
      setCompletedOrder(res);
      showAlert('success', 'Transaksi berhasil disimpan!');
    } catch (err: any) {
      showAlert('error', err?.response?.data?.message || 'Gagal memproses transaksi kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!completedOrder) return;
    const receiptData: ReceiptData = {
      orderNumber: completedOrder.orderNumber,
      date: new Date(completedOrder.createdAt),
      customerName: completedOrder.customer?.name || selectedCustomer?.name || 'Pelanggan Umum',
      customerPhone: completedOrder.customer?.phone || selectedCustomer?.phone || '-',
      cashierName: 'Kasir',
      items: (completedOrder.items || []).map((it) => ({
        name: it.category?.name || 'Layanan Laundry',
        quantity: it.quantity,
        unit: it.category?.unit || 'KG',
        price: it.pricePerUnit,
        total: it.totalPrice,
      })),
      totalAmount: completedOrder.totalAmount,
      paymentStatus: completedOrder.paymentStatus,
      paymentMethodName: paymentChoice === 'cash' ? 'Tunai' : paymentChoice === 'qris' ? 'QRIS' : 'Belum Bayar',
      notes: completedOrder.notes || undefined,
    };

    printReceiptRaw(receiptData, DEFAULT_STORE_CONFIG);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pt-6 md:pt-8">
      {/* Clean Top Navigation Bar with plenty of headroom */}
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 lg:px-8 mb-5">
        <header className="bg-white border border-slate-200/90 rounded-2xl shadow-sm px-5 lg:px-7 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/orders')}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke Pesanan"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-primary inline-block"></span>
                Kasir Laundry (POS)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Mode Transaksi Cepat & Ramah Sentuh</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetPos}
              className="px-4 py-2.5 text-xs md:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Transaksi Baru
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 text-xs md:text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all"
            >
              Dashboard
            </button>
          </div>
        </header>
      </div>

      {/* Main Split Layout: Left Catalog (7 cols) & Right Cart (5 cols) */}
      <div className="flex-1 px-4 md:px-6 lg:px-8 pb-8 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Customer Selection & Services Catalog */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. PELANGGAN: Clean Card with Popover/Dropdown and Outside-Click Handler */}
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-primary" /> Pelanggan Terpilih
              </span>
              <button
                type="button"
                onClick={() => setShowNewCustModal(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Pelanggan Baru
              </button>
            </div>

            <div className="relative" ref={customerDropdownRef}>
              {/* Active Selected Customer Bar */}
              <div
                onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-primary font-bold flex items-center justify-center text-sm shadow-sm">
                    {selectedCustomer ? selectedCustomer.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm md:text-base">
                      {selectedCustomer ? selectedCustomer.name : 'Pilih Pelanggan...'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedCustomer ? selectedCustomer.phone || 'Tanpa No. HP' : 'Klik untuk mencari atau mengganti'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 text-xs font-bold text-primary bg-white border border-primary/20 rounded-lg shadow-2xs">
                  Ganti
                </span>
              </div>

              {/* Popover Dropdown (Auto closes when click outside) */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ketik nama atau nomor HP..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {customerSearch && (
                      <button
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {isLoadingCustomers ? (
                      <p className="p-3 text-xs text-slate-400 text-center">Memuat pelanggan...</p>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-500">Pelanggan tidak ditemukan</p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCustName(customerSearch);
                            setShowNewCustModal(true);
                          }}
                          className="mt-2 px-3 py-1 text-xs font-bold text-white bg-primary rounded-lg"
                        >
                          + Tambah "{customerSearch}"
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const isSelected = cust.id === selectedCustomerId;
                        return (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setIsCustomerDropdownOpen(false);
                              setCustomerSearch('');
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                              isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold">{cust.name}</p>
                              <p className="text-xs text-slate-400 font-normal">{cust.phone || '-'}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. KATALOG LAYANAN (DENGAN KONTROL LANGSUNG DI CARD UNTUK LANSIA/OPERATOR) */}
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Segmented Filter Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCategoryTab === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Layanan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('kiloan')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCategoryTab === 'kiloan'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kiloan (KG)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('satuan')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedCategoryTab === 'satuan'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satuan (PCS)
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari layanan..."
                  value={searchItemQuery}
                  onChange={(e) => setSearchItemQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Grid of Service Cards with In-Card Stepper */}
            {isLoadingCategories ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                Memuat katalog layanan laundry...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-2xl">
                Tidak ada layanan pada kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredCategories.map((cat) => {
                  const currentQty = cartQuantityMap.get(cat.id) || 0;
                  const isSelected = currentQty > 0;

                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded-md mb-1.5 ${
                            cat.unit === 'KG' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {cat.unit === 'KG' ? 'Kiloan' : 'Satuan'}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm md:text-base leading-snug">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Estimasi: {cat.estimatedDays || 2} hari
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-primary text-base md:text-lg">
                            {formatRupiah(cat.basePrice)}
                          </p>
                          <p className="text-[11px] text-slate-400 font-semibold">per {cat.unit}</p>
                        </div>
                      </div>

                      {/* IN-CARD CONTROLS: Lansia/Operator can directly ADD/MINUS right here without scrolling! */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {isSelected ? (
                          <div className="flex items-center justify-between w-full bg-white p-1 rounded-xl border border-primary/30 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleMinusFromCart(cat.id)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center font-bold text-slate-700 transition-colors"
                              title="Kurang 1"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-black text-primary text-sm px-3">
                              {currentQty} {cat.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(cat)}
                              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center font-bold transition-colors shadow-2xs"
                              title="Tambah 1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(cat)}
                            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                          >
                            <Plus className="w-4 h-4" /> Tambah ke Keranjang
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Cart & Simple 3-Choice Payment */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200/80 flex flex-col min-h-[560px]">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {cart.length}
                </div>
                <h3 className="font-bold text-slate-800 text-base">Keranjang Pesanan</h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 my-2 max-h-[320px] pr-1">
              {cart.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Shirt className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pilih layanan di sebelah kiri untuk menambah cucian</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.category.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">
                          {item.category.name}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {formatRupiah(item.category.basePrice)} / {item.category.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">
                          {formatRupiah(item.category.basePrice * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Stepper & Trash in Cart */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 shadow-2xs font-bold text-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step={item.category.unit === 'KG' ? '0.1' : '1'}
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                          className="w-14 text-center text-xs font-black bg-transparent focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-slate-400 pr-1.5">
                          {item.category.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 shadow-2xs font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Weight Chips for Kiloan */}
                      {item.category.unit === 'KG' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAddWeight(idx, 0.5)}
                            className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                          >
                            +0.5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddWeight(idx, 1)}
                            className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                          >
                            +1.0
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors ml-auto"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PAYMENT CHOICE: 3 Clear Options */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Metode Pembayaran</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('unpaid')}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    paymentChoice === 'unpaid'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs ring-1 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs leading-tight">Belum Bayar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('cash')}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    paymentChoice === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs ring-1 ring-emerald-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs leading-tight">Tunai / Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('qris')}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    paymentChoice === 'qris'
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs ring-1 ring-primary/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-primary" />
                  <span className="text-xs leading-tight">QRIS</span>
                </button>
              </div>

              {/* Total & Checkout Button */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Total Pembayaran</p>
                  <p className="text-xs text-slate-400">{totalItemsCount.toFixed(1)} Total Unit/Qty</p>
                </div>
                <p className="text-xl font-black text-slate-900">
                  {formatRupiah(subtotal)}
                </p>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCheckout}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                  cart.length === 0 || isSubmitting
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-primary hover:bg-primary-hover active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  'Memproses Transaksi...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    SIMPAN & PROSES PESANAN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah Pelanggan Baru */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Tambah Pelanggan Baru</h3>
              <button
                onClick={() => setShowNewCustModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Contoh: Ibu Rina"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="08xxxxxxxx"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alamat (Opsional)</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Alamat singkat"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs"
                >
                  {createCustomer.isPending ? 'Menyimpan...' : 'Simpan & Pilih'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Transaksi Berhasil & Cetak Struk */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nomor Pesanan: <span className="font-bold text-slate-800">{completedOrder.orderNumber}</span>
              </p>
              <p className="text-lg font-black text-primary mt-1">
                {formatRupiah(completedOrder.totalAmount)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1 text-slate-600 border border-slate-200/80">
              <p>Pelanggan: <span className="font-bold text-slate-800">{selectedCustomer?.name}</span></p>
              <p>Status: <span className="font-bold text-slate-800">{completedOrder.paymentStatus}</span></p>
              <p>Metode: <span className="font-bold text-slate-800">{paymentChoice.toUpperCase()}</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk Kasir (58mm)
              </button>
              <button
                type="button"
                onClick={handleResetPos}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
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
