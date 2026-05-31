import { useState } from "react";
import apiClient from "../lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Tooltip,
} from "@nextui-org/react";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { useAlert } from "../contexts/AlertContext";
import { TableSkeleton } from "../components/ui/TableSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { QueryErrorState } from "../components/ui/QueryErrorState";

interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

export function Promotions() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    validFrom: "",
    validUntil: "",
  });

  const {
    data: promotions,
    isLoading,
    error,
  } = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const res = await apiClient.get("/promotions");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiClient.post("/promotions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      showAlert("Promo berhasil dibuat", "success");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showAlert(err.response?.data?.error || "Gagal membuat promo", "danger");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/promotions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      showAlert("Promo berhasil diperbarui", "success");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showAlert(
        err.response?.data?.error || "Gagal memperbarui promo",
        "danger",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      showAlert("Promo berhasil dinonaktifkan", "success");
      setDeletingId(null);
    },
    onError: () => {
      showAlert("Gagal menghapus promo", "danger");
      setDeletingId(null);
    },
  });

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedPromoId(null);
    setFormData({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      validFrom: "",
      validUntil: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setIsEditMode(true);
    setSelectedPromoId(promo.id);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue,
      maxDiscount: promo.maxDiscount || 0,
      validFrom: promo.validFrom
        ? new Date(promo.validFrom).toISOString().slice(0, 16)
        : "",
      validUntil: promo.validUntil
        ? new Date(promo.validUntil).toISOString().slice(0, 16)
        : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue),
      maxDiscount: Number(formData.maxDiscount) || undefined,
      validFrom: formData.validFrom
        ? new Date(formData.validFrom).toISOString()
        : undefined,
      validUntil: formData.validUntil
        ? new Date(formData.validUntil).toISOString()
        : undefined,
    };

    if (isEditMode && selectedPromoId) {
      updateMutation.mutate({ id: selectedPromoId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex-1 pt-24 pb-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop w-full flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">
              local_offer
            </span>
            Promosi & Kupon
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Kelola kode diskon dan kupon promosi.
          </p>
        </div>
        <Button
          color="primary"
          onPress={openCreateModal}
          startContent={
            <span className="material-symbols-outlined text-[20px]">add</span>
          }
          className="px-6 py-6 rounded-xl text-label-md font-label-md shadow-sm whitespace-nowrap self-start sm:self-auto text-white"
        >
          Buat Promo Baru
        </Button>
      </div>

      {error && (
        <QueryErrorState
          error={error as Error}
          onRetry={() => window.location.reload()}
          compact
        />
      )}

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
        <Table
          aria-label="Promotions Table"
          removeWrapper
          shadow="none"
          className="min-w-max w-full"
        >
          <TableHeader>
            <TableColumn>KODE PROMO</TableColumn>
            <TableColumn>JENIS DISKON</TableColumn>
            <TableColumn>NILAI DISKON</TableColumn>
            <TableColumn>MIN. ORDER</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn className="text-right">AKSI</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<TableSkeleton rows={4} columns={6} />}
            emptyContent={
              <EmptyState
                icon="local_offer"
                title="Belum ada promo"
                description="Buat promo pertama Anda untuk menarik pelanggan."
              />
            }
          >
            {(promotions || []).map((promo) => (
              <TableRow key={promo.id}>
                <TableCell>
                  <div className="font-bold text-primary text-lg">
                    {promo.code}
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {promo.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      promo.discountType === "PERCENTAGE"
                        ? "primary"
                        : "secondary"
                    }
                  >
                    {promo.discountType}
                  </Chip>
                </TableCell>
                <TableCell>
                  {promo.discountType === "PERCENTAGE"
                    ? `${promo.discountValue}% (Maks ${formatCurrency(promo.maxDiscount || 0)})`
                    : formatCurrency(promo.discountValue)}
                </TableCell>
                <TableCell>{formatCurrency(promo.minOrderValue)}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="dot"
                    color={promo.isActive ? "success" : "danger"}
                  >
                    {promo.isActive ? "Aktif" : "Nonaktif"}
                  </Chip>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip content="Edit">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openEditModal(promo)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </Button>
                    </Tooltip>
                    {promo.isActive && (
                      <Tooltip content="Nonaktifkan">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => setDeletingId(promo.id)}
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Promo" : "Buat Promo Baru"}
        onSubmit={handleSubmit}
        isSubmitDisabled={
          !formData.code ||
          formData.discountValue <= 0 ||
          createMutation.isPending ||
          updateMutation.isPending
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Kode Promo"
            placeholder="Misal: LEBARAN20"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            variant="bordered"
          />
          <Input
            label="Deskripsi"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            variant="bordered"
          />
          <Select
            label="Jenis Diskon"
            selectedKeys={[formData.discountType]}
            onChange={(e) =>
              setFormData({
                ...formData,
                discountType: e.target.value as "PERCENTAGE" | "FIXED",
              })
            }
            variant="bordered"
          >
            <SelectItem key="PERCENTAGE" value="PERCENTAGE">
              Persentase (%)
            </SelectItem>
            <SelectItem key="FIXED" value="FIXED">
              Nominal Tetap (Rp)
            </SelectItem>
          </Select>
          <Input
            type="number"
            label={
              formData.discountType === "PERCENTAGE"
                ? "Nilai Diskon (%)"
                : "Nilai Diskon (Rp)"
            }
            value={formData.discountValue.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                discountValue: Number(e.target.value),
              })
            }
            variant="bordered"
          />
          {formData.discountType === "PERCENTAGE" && (
            <Input
              type="number"
              label="Maksimal Diskon (Rp)"
              value={formData.maxDiscount.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxDiscount: Number(e.target.value),
                })
              }
              variant="bordered"
              description="Isi 0 untuk tanpa batas."
            />
          )}
          <Input
            type="number"
            label="Minimal Order (Rp)"
            value={formData.minOrderValue.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                minOrderValue: Number(e.target.value),
              })
            }
            variant="bordered"
          />
          <Input
            type="datetime-local"
            label="Berlaku Dari (Opsional)"
            placeholder=" "
            value={formData.validFrom}
            onChange={(e) =>
              setFormData({ ...formData, validFrom: e.target.value })
            }
            variant="bordered"
          />
          <Input
            type="datetime-local"
            label="Berlaku Sampai (Opsional)"
            placeholder=" "
            value={formData.validUntil}
            onChange={(e) =>
              setFormData({ ...formData, validUntil: e.target.value })
            }
            variant="bordered"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Nonaktifkan Promo"
        message="Apakah Anda yakin ingin menonaktifkan promo ini? Promo yang dinonaktifkan tidak dapat digunakan lagi."
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
        confirmText="Nonaktifkan"
      />
    </div>
  );
}
