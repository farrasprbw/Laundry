import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCustomers } from '../../hooks/use-customers';
import { useCategories } from '../../hooks/use-categories';
import { useCreateOrder } from '../../hooks/use-orders';
import { usePaymentMethods } from '../../hooks/use-payment-methods';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">('UNPAID');
  const [discount, setDiscount] = useState('0');
  const [parfume, setParfume] = useState('');

  const { data: customersData, isLoading: isLoadingCustomers, refetch: refetchCustomers } = useCustomers({ limit: 100 });
  const { data: categoriesData, isLoading: isLoadingCategories, refetch: refetchCategories } = useCategories();
  const { data: paymentMethodsData, isLoading: isLoadingPM, refetch: refetchPM } = usePaymentMethods();

  const createOrder = useCreateOrder();

  // Refetch all data setiap kali modal dibuka agar data terbaru selalu tampil
  useEffect(() => {
    if (isOpen) {
      refetchCustomers();
      refetchCategories();
      refetchPM();
    }
  }, [isOpen, refetchCustomers, refetchCategories, refetchPM]);

  const customers = customersData?.data || [];
  const categories = categoriesData || [];
  const paymentMethods = paymentMethodsData || [];

  const selectedCategory = categories.find(c => c.id === categoryId);
  const subtotal = selectedCategory && quantity ? selectedCategory.pricePerUnit * Number(quantity) : 0;
  const discountAmount = Number(discount) || 0;
  const totalPrice = Math.max(0, subtotal - discountAmount);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount).replace('IDR', 'Rp');

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} - ${hh}:${min}`;
  };

  const getEstimatedFinish = (createdAt: string, durationMinutes: number) => {
    const d = new Date(createdAt);
    d.setMinutes(d.getMinutes() + durationMinutes);
    return formatDateTime(d.toISOString());
  };

  const buildInvoiceWALink = (order: any) => {
    const customer = customers.find(c => c.id === customerId);
    const category = selectedCategory;
    const selectedPM = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (!customer) return null;

    const phone = customer.phone.replace(/\D/g, '');
    const intlPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;

    const qty = Number(quantity);
    const unitLabel = category?.unit ?? 'kg';
    const categoryName = category?.name ?? 'Laundry';
    const pricePerUnit = category?.pricePerUnit ?? 0;
    const total = order.totalPrice;
    const disc = order.discount ?? 0;
    const subTotal = total + disc;
    const paymentStatusLabel = paymentStatus === 'PAID' ? 'LUNAS ✅' : 'BELUM BAYAR ❌';
    const pmName = selectedPM?.name ?? '-';
    const estSelesai = category?.estimatedDurationMinutes
      ? getEstimatedFinish(order.createdAt, category.estimatedDurationMinutes)
      : '-';
    const parfumeLabel = order.parfume || '-';

    const invoiceUrl = `${window.location.origin}/invoice/${order.invoiceNumber}`;

    const message = `*MAXPRESS LAUNDROMAT*
Apartment Amethys, Jl. Rajawali Selatan II No. 6 B, Jakarta Pusat
HP : 0812-9678-8330

━━━━━━━━━━━━━━━━━━━━

📋 *DETAIL ORDER*
No Invoice  : ${order.invoiceNumber}
Pelanggan   : *${customer.name}*
Tgl Masuk   : ${formatDateTime(order.createdAt)}
Est Selesai : ${estSelesai}

━━━━━━━━━━━━━━━━━━━━

🧺 *${categoryName}*
   ${qty} ${unitLabel} x ${formatCurrency(pricePerUnit)}
   = ${formatCurrency(subTotal)}

━━━━━━━━━━━━━━━━━━━━

💳 Status Bayar : ${paymentStatusLabel}
   SubTotal     : ${formatCurrency(subTotal)}
   Diskon       : ${disc > 0 ? `- ${formatCurrency(disc)}` : 'Rp 0'}
   *Total       : ${formatCurrency(total)}*

💰 Pembayaran : ${pmName}
📌 Status     : SEDANG DIPROSES
🌸 Parfum     : ${parfumeLabel}
📝 Notes      : ${pmName}
   BCA 6565125439 a/n NUR PUJI LESTARI

━━━━━━━━━━━━━━━━━━━━

📄 *Lihat Invoice Online:*
${invoiceUrl}

Terima kasih telah mempercayakan cucian Kakak kepada *Maxpress Laundromat*! 🙏
Cucian sedang kami proses, kami akan hubungi kembali setelah selesai.`;

    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = () => {
    if (!customerId || !categoryId || !quantity || Number(quantity) <= 0 || !paymentMethodId || !paymentStatus) {
      alert("Mohon lengkapi semua data wajib (Pelanggan, Layanan, Berat/Jumlah, dan Metode Pembayaran) dengan benar.");
      return;
    }

    createOrder.mutate(
      {
        customerId,
        categoryId,
        quantity: Number(quantity),
        notes: notes || undefined,
        paymentMethodId: paymentMethodId || undefined,
        paymentStatus,
        discount: discountAmount,
        parfume: parfume || undefined,
      },
      {
        onSuccess: (order) => {
          // Auto-send invoice via WhatsApp
          const waLink = buildInvoiceWALink(order);
          if (waLink) {
            window.open(waLink, '_blank');
          }

          setCustomerId('');
          setCategoryId('');
          setQuantity('');
          setNotes('');
          setPaymentMethodId('');
          setPaymentStatus('UNPAID');
          setDiscount('0');
          setParfume('');
          onClose();
        },
        onError: (err: any) => {
          alert(err?.message || "Gagal membuat order");
        }
      }
    );
  };

  const isFormIncomplete = !customerId || !categoryId || !quantity || Number(quantity) <= 0 || !paymentMethodId || !paymentStatus;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Order Baru"
      onSubmit={handleSubmit}
      submitText="Buat Order"
      isSubmitDisabled={isFormIncomplete || createOrder.isPending}
      isLoading={createOrder.isPending}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Pilih Pelanggan</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Pilih pelanggan...</option>
            {isLoadingCustomers ? (
              <option disabled>Loading...</option>
            ) : (
              customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))
            )}
            <option value="new" disabled>+ Tambah Pelanggan Baru (Dari menu Customers)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Layanan</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Pilih layanan...</option>
            {isLoadingCategories ? (
              <option disabled>Loading...</option>
            ) : (
              categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Rp {c.pricePerUnit.toLocaleString('id-ID')}/{c.unit})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Berat / Jumlah {selectedCategory ? `(${selectedCategory.unit})` : ''}</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                step="0.1"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Diskon (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">Rp</span>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Subtotal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">Rp</span>
              <input
                type="text"
                value={subtotal.toLocaleString('id-ID')}
                readOnly
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-body-md text-on-surface-variant focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Total Harga</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">Rp</span>
              <input
                type="text"
                value={totalPrice.toLocaleString('id-ID')}
                readOnly
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-body-md text-on-surface-variant focus:outline-none cursor-not-allowed font-bold"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Metode Pembayaran</label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Pilih Metode</option>
              {isLoadingPM ? (
                <option disabled>Loading...</option>
              ) : (
                paymentMethods.filter(pm => pm.isActive).map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Status Pembayaran</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="UNPAID"
                  checked={paymentStatus === 'UNPAID'}
                  onChange={() => setPaymentStatus('UNPAID')}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-body-md text-on-surface">Belum Lunas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="PAID"
                  checked={paymentStatus === 'PAID'}
                  onChange={() => setPaymentStatus('PAID')}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-body-md text-on-surface">Lunas</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Parfum (Opsional)</label>
          <input
            type="text"
            placeholder="Contoh: Lavender, Rose, Ocean Fresh..."
            value={parfume}
            onChange={(e) => setParfume(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-label-md font-label-md text-on-surface">Catatan (Opsional)</label>
          <textarea
            placeholder="Tambahkan catatan khusus untuk order ini..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
          ></textarea>
        </div>
      </div>
    </Modal>
  );
}
