import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useCategories } from "../../hooks/use-categories";
import { useUpdateOrder } from "../../hooks/use-orders";
import { usePaymentMethods } from "../../hooks/use-payment-methods";
import type { Order } from "../../types/api";
import {
  Select,
  SelectItem,
  Input,
  RadioGroup,
  Radio,
  Textarea,
} from "@nextui-org/react";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
}: EditOrderModalProps) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">(
    "UNPAID",
  );
  const [parfume, setParfume] = useState("");
  const [discount, setDiscount] = useState("");

  const { data: categoriesData } = useCategories();

  const { data: paymentMethodsData, isLoading: isLoadingPM } =
    usePaymentMethods();

  const updateOrder = useUpdateOrder();

  useEffect(() => {
    if (isOpen && order) {
      setQuantity(order.quantity || "");
      setNotes(order.notes || "");
      setPaymentMethodId(order.paymentMethodId || "");
      setPaymentStatus(order.paymentStatus || "UNPAID");
      setParfume(order.parfume || "");
      setDiscount(order.discount ? String(order.discount) : "");
    }
  }, [isOpen, order]);

  const categories = categoriesData || [];
  const paymentMethods = paymentMethodsData || [];

  const selectedCategory = categories.find((c) => c.id === order?.categoryId);
  const subtotal =
    selectedCategory && quantity
      ? selectedCategory.pricePerUnit * Number(quantity)
      : 0;
  const currentDiscount = Number(discount) || 0;
  const totalPrice = Math.max(0, subtotal - currentDiscount);

  const handleSubmit = () => {
    if (!order || !quantity || Number(quantity) <= 0 || !paymentStatus) {
      alert(
        "Mohon lengkapi data wajib (Berat/Jumlah, Status Pembayaran) dengan benar.",
      );
      return;
    }

    updateOrder.mutate(
      {
        id: order.id,
        quantity: Number(quantity),
        notes: notes || undefined,
        paymentMethodId: paymentMethodId || undefined,
        paymentStatus,
        discount: currentDiscount,
        parfume: parfume || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { message?: string };
          alert(err?.message || "Gagal mengupdate order");
        },
      },
    );
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Order ${order.invoiceNumber}`}
      onSubmit={handleSubmit}
      submitText="Simpan Perubahan"
      isSubmitDisabled={
        !quantity || Number(quantity) <= 0 || updateOrder.isPending
      }
      isLoading={updateOrder.isPending}
    >
      <div className="flex flex-col gap-4">
        {/* Read-only customer info */}
        <Input
          label="Pelanggan"
          value={order.customer?.name || "-"}
          isReadOnly
          variant="flat"
        />

        <Input
          label="Layanan"
          value={order.category?.name || "-"}
          isReadOnly
          variant="flat"
        />

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
            type="number"
            label="Diskon (Rp)"
            placeholder="0"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            variant="bordered"
          />
        </div>

        <Input
          type="text"
          label="Total Harga Baru"
          value={totalPrice.toLocaleString("id-ID")}
          isReadOnly
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">Rp</span>
            </div>
          }
          variant="flat"
          className="font-bold"
        />

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
              .filter((pm) => pm.isActive || pm.id === order.paymentMethodId)
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
