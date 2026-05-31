import { useState, useEffect, useRef } from "react";
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
  Checkbox,
} from "@nextui-org/react";
import { Trash2, Plus, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<
    { categoryId: string; quantity: string }[]
  >([{ categoryId: "", quantity: "" }]);
  const [notes, setNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">(
    "UNPAID",
  );
  const [parfume, setParfume] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  
  const { showAlert } = useAlert();

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const scrollerRef = useRef<HTMLElement>(null);

  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = useCustomers({ 
    search: customerSearch.length >= 3 ? customerSearch : "", 
    page: customerPage, 
    limit: 10 
  });

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

  const { data: promotionsData, refetch: refetchPromos } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const res = await apiClient.get("/promotions");
      return res.data;
    },
  });

  const createOrder = useCreateOrder();

  useEffect(() => {
    if (isOpen) {
      refetchCustomers();
      refetchCategories();
      refetchPM();
      refetchPromos();
    } else {
      // reset when closed
      setCustomerSearch("");
      setCustomerPage(1);
      setCustomerId("");
      setItems([{ categoryId: "", quantity: "" }]);
      setNotes("");
      setPaymentMethodId("");
      setPaymentStatus("UNPAID");
      setParfume("");
      setPromotionId("");
      setUsePoints(false);
    }
  }, [isOpen, refetchCustomers, refetchCategories, refetchPM, refetchPromos]);

  // Update customers list when data changes
  useEffect(() => {
    if (customersData?.data) {
      if (customerPage === 1) {
        setCustomersList((prev) => {
          let newData = [...customersData.data];
          // Ensure selected customer is always in the list so Autocomplete doesn't reset it (which causes infinite loop)
          if (customerId) {
            const selected = prev.find((c: any) => c.id === customerId);
            if (selected && !newData.some((c: any) => c.id === customerId)) {
              newData = [selected, ...newData];
            }
          }
          return newData;
        });
      } else {
        setCustomersList((prev) => {
          const newItems = customersData.data.filter(
            (c: any) => !prev.some((p) => p.id === c.id)
          );
          return [...prev, ...newItems];
        });
      }
    }
  }, [customersData, customerPage, customerId]);

  // Handle scroll to load more manually via ref
  useEffect(() => {
    let attached = false;
    let el: HTMLElement | null = null;
    let interval: ReturnType<typeof setInterval>;

    const handleScrollEvent = () => {
      if (!el) return;
      // toleransi 10px-20px dari bawah
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;
      
      if (isAtBottom && !isLoadingCustomers && customersData && customersData.pagination.page < customersData.pagination.totalPages) {
        setCustomerPage((prev) => prev + 1);
      }
    };

    const attemptAttach = () => {
      el = scrollerRef.current;
      if (el && !attached) {
        el.addEventListener("scroll", handleScrollEvent);
        attached = true;
        clearInterval(interval);
      }
    };

    interval = setInterval(attemptAttach, 100);
    attemptAttach();

    return () => {
      clearInterval(interval);
      if (attached && el) {
        el.removeEventListener("scroll", handleScrollEvent);
      }
    };
  }, [isLoadingCustomers, customersData, isAutocompleteOpen]);

  const handleInputChange = (val: string) => {
    setCustomerSearch(val);
    setCustomerPage(1);
  };

  const categories = categoriesData || [];
  const paymentMethods = paymentMethodsData || [];
  const promotions = promotionsData || [];

  const selectedCustomer = customersList.find((c: any) => c.id === customerId) || (customersData?.data || []).find((c: any) => c.id === customerId);

  const totalSubtotal = items.reduce((acc, item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    if (category && item.quantity) {
      return acc + category.pricePerUnit * Number(item.quantity);
    }
    return acc;
  }, 0);

  // Kalkulasi diskon promo
  let promoDiscount = 0;
  if (promotionId) {
    const promo = promotions.find((p: any) => p.id === promotionId);
    if (promo && promo.isActive && totalSubtotal >= promo.minOrderValue) {
      if (promo.discountType === "PERCENTAGE") {
        let calc = totalSubtotal * (promo.discountValue / 100);
        if (promo.maxDiscount && calc > promo.maxDiscount) calc = promo.maxDiscount;
        promoDiscount = calc;
      } else {
        promoDiscount = promo.discountValue;
      }
    }
  }

  // Kalkulasi points (1 poin = Rp 10.000 diskon misal. Tapi wait, logic default poin blm ditentukan nilainya)
  // Misal 1 point = diskon Rp 1.000 jika digunakan
  let pointsDiscount = 0;
  let pointsToUse = 0;
  if (usePoints && selectedCustomer?.points) {
    pointsToUse = selectedCustomer.points;
    pointsDiscount = pointsToUse * 1000; // Asumsi 1 poin = Rp 1.000
    if (pointsDiscount > totalSubtotal - promoDiscount) {
       // Cap poin diskon hingga tidak minus
       pointsDiscount = totalSubtotal - promoDiscount;
       pointsToUse = Math.ceil(pointsDiscount / 1000);
    }
  }

  const totalDiscount = promoDiscount + pointsDiscount;
  const grandTotal = Math.max(0, totalSubtotal - totalDiscount);

  const isFormIncomplete =
    !customerId ||
    items.some(
      (i) => !i.categoryId || !i.quantity || Number(i.quantity) <= 0,
    ) ||
    !paymentMethodId ||
    !paymentStatus;

  const handleSubmit = () => {
    if (isFormIncomplete) {
      showAlert(
        "Mohon lengkapi semua data wajib (Pelanggan, Layanan, Berat/Jumlah, dan Metode Pembayaran) dengan benar.",
        "warning",
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
        discount: totalDiscount,
        promotionId: promotionId || undefined,
        pointsUsed: pointsToUse,
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
          setPromotionId("");
          setUsePoints(false);
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

  const updateItem = (
    index: number,
    field: "categoryId" | "quantity",
    value: string,
  ) => {
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
          onInputChange={handleInputChange}
          onOpenChange={setIsAutocompleteOpen}
          defaultFilter={() => true}
          isLoading={isLoadingCustomers}
          variant="bordered"
          scrollRef={scrollerRef as React.RefObject<HTMLElement>}
          items={customersList}
        >
          {(c: any) => (
            <AutocompleteItem
              key={c.id}
              value={c.id}
              textValue={`${c.name} (${c.phone})`}
            >
              {c.name} ({c.phone})
            </AutocompleteItem>
          )}
        </Autocomplete>

        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const selectedCategory = categories.find(
              (c) => c.id === item.categoryId,
            );
            return (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  label="Layanan"
                  placeholder="Pilih layanan..."
                  selectedKeys={item.categoryId ? [item.categoryId] : []}
                  onChange={(e) =>
                    updateItem(index, "categoryId", e.target.value)
                  }
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
                      {c.name} (Rp {c.pricePerUnit.toLocaleString("id-ID")}/
                      {c.unit})
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
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
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

        <div className="flex flex-col gap-2">
          <Input
            type="text"
            label="Subtotal"
            value={totalSubtotal.toLocaleString("id-ID")}
            isReadOnly
            startContent={<span className="text-default-400 text-small">Rp</span>}
            variant="bordered"
          />

          <Select
            label="Promo / Kupon (Opsional)"
            placeholder="Pilih promo yang tersedia"
            selectedKeys={promotionId ? [promotionId] : []}
            onChange={(e) => setPromotionId(e.target.value)}
            variant="bordered"
            startContent={<Percent className="w-4 h-4 text-default-400" />}
          >
            {promotions.filter((p: any) => p.isActive).map((p: any) => {
              const isDisabled = totalSubtotal < p.minOrderValue;
              return (
                <SelectItem key={p.id} value={p.id} textValue={p.code} className={isDisabled ? "opacity-50" : ""}>
                  <div className="flex flex-col">
                    <span className="font-bold">{p.code}</span>
                    <span className="text-xs text-default-400">
                      Min. Order: Rp {p.minOrderValue.toLocaleString("id-ID")} {isDisabled && "(Subtotal kurang)"}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </Select>

          {selectedCustomer && selectedCustomer.points > 0 && (
            <div className="flex items-center gap-2 p-3 border border-default-200 rounded-xl bg-default-50">
              <Checkbox isSelected={usePoints} onValueChange={setUsePoints} color="primary" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Gunakan Poin ({selectedCustomer.points} pts)</span>
                <span className="text-xs text-default-500">
                  Akan memotong Rp {(selectedCustomer.points * 1000).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center p-4 bg-primary-50 rounded-xl border border-primary/20">
            <span className="text-sm font-semibold text-primary-800">Total Bayar</span>
            <span className="text-xl font-bold text-primary">
              Rp {grandTotal.toLocaleString("id-ID")}
            </span>
          </div>
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
