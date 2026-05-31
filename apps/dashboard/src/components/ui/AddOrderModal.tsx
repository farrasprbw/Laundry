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
  Button,
  Autocomplete,
  AutocompleteItem,
} from "@nextui-org/react";
import { Trash2, Plus } from "lucide-react";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<{ categoryId: string; quantity: string }[]>([
    { categoryId: "", quantity: "" },
  ]);
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
  } = useCustomers({ limit: 1000 });
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

  const totalPrice = items.reduce((acc, item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    if (category && item.quantity) {
      return acc + category.pricePerUnit * Number(item.quantity);
    }
    return acc;
  }, 0);

  const isFormIncomplete =
    !customerId ||
    items.some((i) => !i.categoryId || !i.quantity || Number(i.quantity) <= 0) ||
    !paymentMethodId ||
    !paymentStatus;

  const handleSubmit = () => {
    if (isFormIncomplete) {
      showAlert(
        "Mohon lengkapi semua data wajib (Pelanggan, Layanan, Berat/Jumlah, dan Metode Pembayaran) dengan benar.",
        "warning"
      );
      return;
    }

    createOrder.mutate(
      {
        customerId,
        items: items.map((i) => ({
          categoryId: i.categoryId,
          quantity: Number(i.quantity),
        })),
        notes: notes || undefined,
        paymentMethodId: paymentMethodId || undefined,
        paymentStatus,
        discount: 0,
        parfume: parfume || undefined,
      },
      {
        onSuccess: () => {
          showAlert("Order berhasil dibuat!", "success");
          setCustomerId("");
          setItems([{ categoryId: "", quantity: "" }]);
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
        <Autocomplete
          label="Pilih Pelanggan"
          placeholder="Cari pelanggan..."
          selectedKey={customerId}
          onSelectionChange={(key) => setCustomerId((key as string) || "")}
          isLoading={isLoadingCustomers}
          variant="bordered"
        >
          {customers.map((c) => (
            <AutocompleteItem
              key={c.id}
              value={c.id}
              textValue={`${c.name} (${c.phone})`}
            >
              {c.name} ({c.phone})
            </AutocompleteItem>
          ))}
        </Autocomplete>

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
