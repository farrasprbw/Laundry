import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useAlert } from "../../contexts/AlertContext";
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
  Button,
} from "@nextui-org/react";
import { Trash2, Plus } from "lucide-react";

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
  const [items, setItems] = useState<{ categoryId: string; quantity: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">(
    "UNPAID",
  );
  const [parfume, setParfume] = useState("");
  const [discount, setDiscount] = useState("");

  const { showAlert } = useAlert();

  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();

  const { data: paymentMethodsData, isLoading: isLoadingPM } =
    usePaymentMethods();

  const updateOrder = useUpdateOrder();

  useEffect(() => {
    if (isOpen && order) {
      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((i) => ({
            categoryId: i.categoryId,
            quantity: i.quantity,
          }))
        );
      } else {
        setItems([{ categoryId: "", quantity: "" }]);
      }
      setNotes(order.notes || "");
      setPaymentMethodId(order.paymentMethodId || "");
      setPaymentStatus(order.paymentStatus || "UNPAID");
      setParfume(order.parfume || "");
      setDiscount(order.discount ? String(order.discount) : "");
    }
  }, [isOpen, order]);

  const categories = categoriesData || [];
  const paymentMethods = paymentMethodsData || [];

  const subtotal = items.reduce((acc, item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    if (category && item.quantity) {
      return acc + category.pricePerUnit * Number(item.quantity);
    }
    return acc;
  }, 0);
  
  const currentDiscount = Number(discount) || 0;
  const totalPrice = Math.max(0, subtotal - currentDiscount);

  const isFormIncomplete =
    items.some((i) => !i.categoryId || !i.quantity || Number(i.quantity) <= 0) ||
    !paymentStatus;

  const handleSubmit = () => {
    if (!order || isFormIncomplete) {
      showAlert(
        "Mohon lengkapi data wajib (Layanan, Jumlah, Status Pembayaran) dengan benar.",
        "warning"
      );
      return;
    }

    updateOrder.mutate(
      {
        id: order.id,
        items: items.map(i => ({ categoryId: i.categoryId, quantity: Number(i.quantity) })),
        notes: notes || undefined,
        paymentMethodId: paymentMethodId || undefined,
        paymentStatus,
        discount: currentDiscount,
        parfume: parfume || undefined,
      },
      {
        onSuccess: () => {
          showAlert("Order berhasil diperbarui!", "success");
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { message?: string };
          showAlert(err?.message || "Gagal mengupdate order", "danger");
        },
      },
    );
  };

  const addItem = () => {
    setItems([...items, { categoryId: "", quantity: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "categoryId" | "quantity", value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Order ${order.invoiceNumber}`}
      onSubmit={handleSubmit}
      submitText="Simpan Perubahan"
      isSubmitDisabled={isFormIncomplete || updateOrder.isPending}
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

        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const selectedCategory = categories.find((c) => c.id === item.categoryId);
            return (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  label="Layanan"
                  placeholder="Pilih layanan..."
                  selectedKeys={item.categoryId ? [item.categoryId] : []}
                  onChange={(e) => updateItem(index, "categoryId", e.target.value)}
                  isLoading={isLoadingCategories}
                  variant="bordered"
                  className="flex-1"
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

                <Input
                  type="number"
                  label={`Jumlah ${selectedCategory ? `(${selectedCategory.unit})` : ""}`}
                  placeholder="0"
                  step="0.1"
                  min="0.1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  variant="bordered"
                  className="w-32"
                />

                {items.length > 1 && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    onPress={() => removeItem(index)}
                    className="mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
          
          <Button 
            variant="light" 
            color="primary" 
            onPress={addItem}
            startContent={<Plus className="w-4 h-4" />}
            className="self-start"
          >
            Tambah Layanan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Diskon (Rp)"
            placeholder="0"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            variant="bordered"
          />

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
