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
  Clock,
  Shirt,
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
  disclaimer: [
    'Pengambilan barang wajib menunjukkan nota.',
    'Barang tidak diambil >30 hari di luar tanggung jawab.',
  ],
  qrCodeUrl: 'https://example.com/invoice/',
};

interface CartItem {
  category: Category;
  quantity: number;
  notes: string;
}

export function PosPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Data Queries
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: customersData } = useCustomers({ limit: 100 });
  const { data: paymentMethods = [] } = usePaymentMethods();
  const createOrder = useCreateOrder();
  const createCustomer = useCreateCustomer();

  // State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('SEMUA');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerModal, setIsNewCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Success Modal State
  const [createdOrderResult, setCreatedOrderResult] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Customers filtering
  const filteredCustomers = useMemo(() => {
    const list: Customer[] = (customersData as any)?.data || (customersData as any)?.items || [];
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [customersData, customerSearch]);

  // Category Tabs
  const categoryTabs = useMemo(() => {
    return ['SEMUA', 'KILOAN', 'SETRIKA SAJA', 'SATUAN / BEDCOVER'];
  }, []);

  const filteredCategories = useMemo(() => {
    if (selectedCategoryTab === 'SEMUA') return categories;
    if (selectedCategoryTab === 'KILOAN') {
      return categories.filter((c) => c.unit.toLowerCase() === 'kg' && !c.name.toLowerCase().includes('setrika'));
    }
    if (selectedCategoryTab === 'SETRIKA SAJA') {
      return categories.filter((c) => c.name.toLowerCase().includes('setrika'));
    }
    if (selectedCategoryTab === 'SATUAN / BEDCOVER') {
      return categories.filter((c) => c.unit.toLowerCase() !== 'kg');
    }
    return categories;
  }, [categories, selectedCategoryTab]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * Number(item.category.pricePerUnit), 0);
  }, [cart]);

  const totalAmount = subtotal;
  const change = Math.max(0, cashGiven - totalAmount);

  // Set default payment method
  if (!selectedPaymentMethodId && paymentMethods.length > 0) {
    setSelectedPaymentMethodId(paymentMethods[0].id);
  }

  // Cart Actions
  const addToCart = (category: Category) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.category.id === category.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const step = category.unit.toLowerCase() === 'kg' ? 1 : 1;
        updated[existingIndex].quantity = Number((updated[existingIndex].quantity + step).toFixed(2));
        return updated;
      }
      return [...prev, { category, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = Number(newQty.toFixed(2));
      return updated;
    });
  };

  const addWeightShortcut = (index: number, addKg: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = Number((updated[index].quantity + addKg).toFixed(2));
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAll = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCashGiven(0);
    setOrderNotes('');
    setPaymentStatus('PAID');
  };

  // Handle Create Quick Customer
  const handleCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showAlert('Nama dan Nomor WhatsApp pelanggan wajib diisi!', 'danger');
      return;
    }
    try {
      const created = await createCustomer.mutateAsync({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
      });
      setSelectedCustomer(created);
      setIsNewCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      showAlert(`Pelanggan ${created.name} berhasil ditambahkan!`, 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Gagal menambah pelanggan', 'danger');
    }
  };

  // Thermal Bluetooth Print
  const printReceipt = async (order: Order) => {
    if (!('bluetooth' in navigator)) {
      window.print();
      return;
    }
    try {
      const receiptData = {
        invoiceNumber: order.invoiceNumber,
        customerName: order.customer?.name || selectedCustomer?.name || 'Pelanggan',
        items: cart.map((i) => ({
          categoryName: i.category.name,
          quantity: i.quantity,
          unit: i.category.unit,
          pricePerUnit: Number(i.category.pricePerUnit),
          subtotal: i.quantity * Number(i.category.pricePerUnit),
        })),
        totalPrice: totalAmount,
        paymentStatus: paymentStatus,
        createdAt: new Date().toISOString(),
        estimatedDurationDays: 2,
      };

      const bytes = buildLaundryReceipt(receiptData, DEFAULT_STORE_CONFIG);
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const CHUNK_SIZE = 512;
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
      }
      showAlert('Nota berhasil dicetak ke printer Bluetooth!', 'success');
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        showAlert('Gagal cetak Bluetooth: ' + (err.message || 'Error printer'), 'danger');
      }
    }
  };

  // Checkout Submit
  const handleSubmitOrder = async (withPrint: boolean) => {
    if (!selectedCustomer) {
      showAlert('Pilih atau masukkan pelanggan terlebih dahulu!', 'danger');
      return;
    }
    if (cart.length === 0) {
      showAlert('Pilih minimal satu layanan laundry!', 'danger');
      return;
    }
    if (paymentStatus === 'PAID' && cashGiven > 0 && cashGiven < totalAmount) {
      showAlert('Uang pembayaran kurang dari total tagihan!', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cart.map((i) => ({
        categoryId: i.category.id,
        quantity: i.quantity,
      }));

      const payload = {
        customerId: selectedCustomer.id,
        items: orderItems,
        paymentStatus,
        paymentMethodId: paymentStatus === 'PAID' ? selectedPaymentMethodId : undefined,
        notes: orderNotes || undefined,
      };

      const order = await createOrder.mutateAsync(payload);
      setCreatedOrderResult(order);
      showAlert(`Pesanan ${order.invoiceNumber} BERHASIL DISIMPAN!`, 'success');

      if (withPrint) {
        await printReceipt(order);
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Gagal menyimpan pesanan', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans p-4 md:p-6 lg:p-8 pb-16 md:pb-8 w-full">
      {/* TOP BAR / HEADER KASIR */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 text-2xl shrink-0">
            🧺
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
              KASIR LAUNDRY (POS)
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Layar sentuh ramah staf & pencatatan nota cepat
            </p>
          </div>
        </div>

        {/* Tombol Batal & Mulai Ulang */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={resetAll}
            className="px-4 py-2.5 rounded-xl border-2 border-red-200 hover:bg-red-50 text-red-600 font-bold text-sm flex items-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kosongkan / Ulangi</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN SPLIT SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* KOLOM KIRI (7 SPAN): PILIH PELANGGAN & PILIH LAYANAN */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* 1. KOTAK PELANGGAN (Besar & Jelas) */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                Langkah 1: Siapa Pelanggannya?
              </span>
              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-blue-600 font-bold underline hover:text-blue-800"
                >
                  Ganti Pelanggan
                </button>
              )}
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-300 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-sm font-bold text-blue-800">
                      📱 WhatsApp: {selectedCustomer.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block font-semibold">Poin Cuci</span>
                  <span className="text-lg font-black text-emerald-600">{selectedCustomer.points || 0} Pts</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-6 h-6 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Ketik Nama atau Nomor HP Pelanggan..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-base font-bold rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewCustomerModal(true)}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shrink-0 shadow-sm transition active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">+ Pelanggan Baru</span>
                    <span className="sm:hidden">+ Baru</span>
                  </button>
                </div>

                {/* Dropdown Hasil Pencarian Cepat */}
                {filteredCustomers.length > 0 && (
                  <div className="bg-white border-2 border-blue-400 rounded-xl shadow-lg overflow-hidden divide-y divide-gray-100 mt-1">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-black text-base text-gray-900 block">{c.name}</span>
                          <span className="text-xs font-semibold text-gray-500">No. WA: {c.phone}</span>
                        </div>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                          Pilih Ini &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. KOTAK PILIH LAYANAN (Touch Cards Besar) */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                Langkah 2: Tekan Layanan Yang Dipilih
              </span>
              <span className="text-xs font-bold text-gray-400">
                {filteredCategories.length} Layanan Siap
              </span>
            </div>

            {/* Filter Tabs Tombol Besar */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCategoryTab(tab)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    selectedCategoryTab === tab
                      ? 'bg-gray-900 text-white scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid Kartu Layanan (Sangat Mudah Ditekan) */}
            {loadingCats ? (
              <div className="p-8 text-center text-gray-400 font-bold">Memuat daftar layanan...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => addToCart(cat)}
                    className="border-2 border-gray-200 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50 rounded-2xl p-4 cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">
                          {cat.name.toLowerCase().includes('setrika') ? '👔' : cat.unit === 'kg' ? '🧺' : '🛏️'}
                        </span>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono">
                          {cat.unit.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 leading-snug group-hover:text-emerald-700">
                        {cat.name}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-base font-black text-emerald-600 font-mono">
                        Rp {Number(cat.pricePerUnit).toLocaleString('id-ID')} / {cat.unit}
                      </span>
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {cat.estimatedDurationDays ? `${cat.estimatedDurationDays} Hari` : '2 Hari'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (5 SPAN): KERANJANG, BOBOT & BAYAR */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-md flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Langkah 3: Timbangan & Total Nota
              </span>
              <span className="text-xs font-black text-gray-500">
                {cart.length} Layanan
              </span>
            </div>

            {/* DAFTAR ITEM CUCIAN */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl my-4 min-h-[220px]">
                <Shirt className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                <p className="font-bold text-base text-gray-700">Keranjang Masih Kosong</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Silakan tekan kotak layanan di sebelah kiri untuk memasukkan cucian pelanggan.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 my-2 flex-1 divide-y divide-gray-100">
                {cart.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-black text-base text-gray-900">
                          {item.category.name}
                        </h5>
                        <p className="text-xs font-bold text-emerald-600 font-mono">
                          Rp {Number(item.category.pricePerUnit).toLocaleString('id-ID')} / {item.category.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Hapus item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* INPUT JUMLAH / BOBOT JUMBO */}
                    <div className="mt-2 flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - (item.category.unit === 'kg' ? 0.5 : 1))}
                          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center font-black text-xl hover:bg-gray-100 active:scale-90 text-gray-800 shadow-sm"
                        >
                          <Minus className="w-5 h-5 stroke-[3]" />
                        </button>

                        <div className="text-center min-w-[70px]">
                          <span className="text-xl font-black text-gray-900 block leading-none">
                            {item.quantity}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {item.category.unit}
                          </span>
                        </div>

                        <button
                          onClick={() => updateQuantity(idx, item.quantity + (item.category.unit === 'kg' ? 0.5 : 1))}
                          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center font-black text-xl hover:bg-gray-100 active:scale-90 text-gray-800 shadow-sm"
                        >
                          <Plus className="w-5 h-5 stroke-[3]" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500 block font-semibold">Subtotal</span>
                        <span className="text-base font-black text-gray-900 font-mono">
                          Rp {(item.quantity * Number(item.category.pricePerUnit)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* SHORTCUT BOBOT KG CEPAT (Sangat ramah staf) */}
                    {item.category.unit === 'kg' && (
                      <div className="flex gap-1.5 mt-2">
                        <span className="text-[11px] font-bold text-gray-500 self-center mr-1">Tambah:</span>
                        {[0.5, 1, 2, 3, 5].map((addVal) => (
                          <button
                            key={addVal}
                            onClick={() => addWeightShortcut(idx, addVal)}
                            className="px-2.5 py-1 text-xs font-black bg-gray-200 rounded-lg hover:bg-emerald-100 text-gray-800 active:scale-90"
                          >
                            +{addVal}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* RINGKASAN PEMBAYARAN */}
            <div className="border-t-2 border-gray-200 pt-3 mt-auto space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-gray-600">TOTAL BAYAR</span>
                <span className="text-2xl font-black text-gray-900 font-mono">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {/* OPSI BAYAR SEKARANG ATAU BAYAR NANTI */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>LUNAS (BAYAR KASIR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('UNPAID')}
                  className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition ${
                    paymentStatus === 'UNPAID'
                      ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>BAYAR NANTI (AMBIL)</span>
                </button>
              </div>

              {/* JIKA LUNAS: PILIH METODE BAYAR & TOMBOL PECAHAN UANG CEPAT */}
              {paymentStatus === 'PAID' && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex gap-2">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setSelectedPaymentMethodId(pm.id)}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs border transition ${
                          selectedPaymentMethodId === pm.id
                            ? 'bg-gray-900 text-white border-gray-900 font-black'
                              : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>

                  {/* Tombol Pecahan Uang Cepat (Jika Tunai) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-500 block">Uang Diterima Dari Pelanggan:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setCashGiven(totalAmount)}
                        className="px-3 py-1.5 text-xs font-black bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200"
                      >
                        Uang Pas
                      </button>
                      {[20000, 50000, 100000].map((nominal) => (
                        <button
                          key={nominal}
                          onClick={() => setCashGiven(nominal)}
                          className="px-3 py-1.5 text-xs font-black bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100"
                        >
                          Rp {nominal.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    {/* Kembalian Text Besar */}
                    {cashGiven > 0 && (
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-300 mt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">Kembalian:</span>
                        <span className="text-lg font-black text-emerald-700 font-mono">
                          Rp {change.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TOMBOL SIMPAN & CETAK JUMBO HIJAU */}
              <button
                disabled={isSubmitting || cart.length === 0 || !selectedCustomer}
                onClick={() => handleSubmitOrder(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <Printer className="w-6 h-6 stroke-[2.5]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'SIMPAN & CETAK NOTA (STRUK)'}</span>
              </button>

              {/* Tombol Simpan Tanpa Cetak */}
              <button
                disabled={isSubmitting || cart.length === 0 || !selectedCustomer}
                onClick={() => handleSubmitOrder(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
              >
                Simpan Saja (Tanpa Cetak)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PELANGGAN BARU (Sangat Simpel: Nama & HP) */}
      {isNewCustomerModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-blue-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                👤
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Tambah Pelanggan Baru</h3>
                <p className="text-xs font-semibold text-gray-500">Cukup nama dan nomor WhatsApp</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bu Siti / Pak Budi"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-3 text-base font-bold rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full p-3 text-base font-bold rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCustomerModal(false)}
                className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="flex-1 py-3 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/30"
              >
                Simpan Pelanggan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES (Struk tersimpan) */}
      {createdOrderResult && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase">
                BERHASIL TERSIMPAN
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                Nota: {createdOrderResult.invoiceNumber}
              </h2>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Total Rp {totalAmount.toLocaleString('id-ID')} ({paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'})
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => printReceipt(createdOrderResult)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-5 h-5" />
                <span>Cetak Nota Lagi (Bluetooth)</span>
              </button>
              <button
                onClick={() => navigate(`/invoice/${createdOrderResult.invoiceNumber}`)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl"
              >
                Buka Detail Nota (Invoice)
              </button>
              <button
                onClick={() => {
                  setCreatedOrderResult(null);
                  resetAll();
                }}
                className="w-full py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-black text-sm rounded-xl border border-blue-200"
              >
                + Buat Pesanan Baru Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
