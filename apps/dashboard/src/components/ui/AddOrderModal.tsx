import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useAlert } from "../../contexts/AlertContext";
import { useCustomers } from "../../hooks/use-customers";
import { useCategories } from "../../hooks/use-categories";
import { useCreateOrder } from "../../hooks/use-orders";
import { usePaymentMethods } from "../../hooks/use-payment-methods";
import {
  Select,
  SelectItem,
  Input,
  RadioGroup,
  Radio,
  Textarea,
} from "@nextui-org/react";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">(
    "UNPAID",
  );
  const [parfume, setParfume] = useState("");
  const { showAlert } = useAlert();

  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = useCustomers({ limit: 100 });
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useCategories();
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPM,
    refetch: refetchPM,
  } = usePaymentMethods();

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

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subtotal =
    selectedCategory && quantity
      ? selectedCategory.pricePerUnit * Number(quantity)
      : 0;
  const totalPrice = subtotal;

  const handleSubmit = () => {
    if (
      !customerId ||
      !categoryId ||
      !quantity ||
      Number(quantity) <= 0 ||
      !paymentMethodId ||
      !paymentStatus
    ) {
      showAlert(
        "Mohon lengkapi semua data wajib (Pelanggan, Layanan, Berat/Jumlah, dan Metode Pembayaran) dengan benar.",
        "warning"
      );
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
        discount: 0,
        parfume: parfume || undefined,
      },
      {
        onSuccess: () => {
          // WhatsApp notification is now handled automatically by the backend via Fonnte API

          setCustomerId("");
          setCategoryId("");
          setQuantity("");
          setNotes("");
          setPaymentMethodId("");
          setPaymentStatus("UNPAID");
          setParfume("");
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { message?: string };
          showAlert(err?.message || "Gagal membuat order", "danger");
        },
      },
    );
  };

  const isFormIncomplete =
    !customerId ||
    !categoryId ||
    !quantity ||
    Number(quantity) <= 0 ||
    !paymentMethodId ||
    !paymentStatus;

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
        <Select
          label="Pilih Pelanggan"
          placeholder="Pilih pelanggan..."
          selectedKeys={customerId ? [customerId] : []}
          onChange={(e) => setCustomerId(e.target.value)}
          isLoading={isLoadingCustomers}
          variant="bordered"
        >
          {customers.map((c) => (
            <SelectItem
              key={c.id}
              value={c.id}
              textValue={`${c.name} (${c.phone})`}
            >
              {c.name} ({c.phone})
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Layanan"
          placeholder="Pilih layanan..."
          selectedKeys={categoryId ? [categoryId] : []}
          onChange={(e) => setCategoryId(e.target.value)}
          isLoading={isLoadingCategories}
          variant="bordered"
        >
          {categories.map((c) => (
            <SelectItem
              key={c.id}
              value={c.id}
              textValue={`${c.name} (Rp ${c.pricePerUnit.toLocaleString("id-ID")}/${c.unit})`}
            >
              {c.name} (Rp {c.pricePerUnit.toLocaleString("id-ID")}/{c.unit})
            </SelectItem>
          ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label={`Berat / Jumlah ${selectedCategory ? `(${selectedCategory.unit})` : ""}`}
            placeholder="0"
            step="0.1"
            min="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            variant="bordered"
          />

          <Input
            type="text"
            label="Total Harga"
            value={totalPrice.toLocaleString("id-ID")}
            isReadOnly
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">Rp</span>
              </div>
            }
            variant="bordered"
            className="font-bold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <Select
            label="Metode Pembayaran"
            placeholder="Pilih Metode"
            selectedKeys={paymentMethodId ? [paymentMethodId] : []}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            isLoading={isLoadingPM}
            variant="bordered"
          >
            {paymentMethods
              .filter((pm) => pm.isActive)
              .map((pm) => (
                <SelectItem key={pm.id} value={pm.id} textValue={pm.name}>
                  {pm.name}
                </SelectItem>
              ))}
          </Select>

          <div className="flex flex-col gap-1.5 pl-1">
            <RadioGroup
              label="Status Pembayaran"
              value={paymentStatus}
              onValueChange={(val) =>
                setPaymentStatus(val as "UNPAID" | "PAID")
              }
              orientation="horizontal"
              classNames={{
                label: "text-small text-default-500",
              }}
            >
              <Radio value="UNPAID">Belum Lunas</Radio>
              <Radio value="PAID">Lunas</Radio>
            </RadioGroup>
          </div>
        </div>

        <Input
          type="text"
          label="Parfum (Opsional)"
          placeholder="Contoh: Lavender, Rose, Ocean Fresh..."
          value={parfume}
          onChange={(e) => setParfume(e.target.value)}
          variant="bordered"
        />

        <Textarea
          label="Catatan (Opsional)"
          placeholder="Tambahkan catatan khusus untuk order ini..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="bordered"
        />
      </div>
    </Modal>
  );
}
