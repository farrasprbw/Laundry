import { useState, useEffect } from "react";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import apiClient from "../lib/api-client";
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
  Spinner,
  Pagination,
  Tooltip,
  Textarea,
} from "@nextui-org/react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  orderCount?: number;
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    data: string | null;
  }>({ open: false, data: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/customers", {
        params: {
          search: debouncedSearch,
          page,
          limit: 10,
          sort: sortOrder,
        },
      });
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, page, sortOrder]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters

    // Convert leading 0 to 62 for Indonesian numbers (useful for WhatsApp)
    if (value.startsWith("0")) {
      value = "62" + value.slice(1);
    }

    setFormData({ ...formData, phone: value });
  };

  // Handle Form Submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return;
    setIsSubmitting(true);
    try {
      if (isEditMode && selectedCustomerId) {
        await apiClient.put(`/customers/${selectedCustomerId}`, formData);
      } else {
        await apiClient.post("/customers", formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      alert(error.response?.data?.error || "Gagal menyimpan data pelanggan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    setConfirmState({ open: true, data: id });
  };

  const onConfirmDelete = async () => {
    if (!confirmState.data) return;
    setDeletingId(confirmState.data);
    try {
      await apiClient.delete(`/customers/${confirmState.data}`);
      fetchCustomers();
      setConfirmState({ open: false, data: null });
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Gagal menghapus data pelanggan");
    } finally {
      setDeletingId(null);
    }
  };

  // Open Modal for Edit
  const openEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setSelectedCustomerId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
    });
    setIsModalOpen(true);
  };

  // Open Modal for Create
  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedCustomerId(null);
    setFormData({ name: "", phone: "", address: "" });
    setIsModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex-1 pt-24 pb-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop w-full flex flex-col gap-8">
      {/* Page Header: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
            <span className="text-primary text-4xl">👥</span> Pelanggan
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Kelola data pelanggan dan riwayat transaksi.
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
          Tambah Pelanggan
        </Button>
      </div>

      {/* Filters & Search Bar Section */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Specific Customer Search */}
        <Input
          className="w-full sm:w-96"
          placeholder="Cari nama atau nomor telepon..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={
            <span className="material-symbols-outlined text-outline mr-1 text-[20px]">
              search
            </span>
          }
          variant="bordered"
        />
        {/* Auxiliary Filters */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Button
            onPress={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            variant={sortOrder === "asc" ? "flat" : "bordered"}
            color={sortOrder === "asc" ? "primary" : "default"}
            className="rounded-lg text-label-md font-label-md whitespace-nowrap"
            startContent={
              <span className="material-symbols-outlined text-[18px]">
                {sortOrder === "desc" ? "arrow_downward" : "arrow_upward"}
              </span>
            }
          >
            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
        <div className="overflow-x-auto w-full">
          <Table
            aria-label="Customers Table"
            removeWrapper
            shadow="none"
            className="min-w-max w-full"
          >
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Nama Pelanggan
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">
                Nomor Telepon
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">
                Alamat
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center">
                Total Order
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                Aksi
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={<Spinner label="Memuat pelanggan..." />}
              emptyContent={
                <div
                  className="flex flex-col items-center justify-center gap-2 text-on-surface-variant cursor-pointer group"
                  onClick={openCreateModal}
                >
                  <span className="material-symbols-outlined text-[32px] opacity-70 group-hover:text-primary transition-colors">
                    person_add
                  </span>
                  <p className="text-body-md font-body-md font-medium group-hover:text-primary transition-colors">
                    Belum menemukan pelanggan?
                  </p>
                  <span className="text-label-sm font-label-sm text-primary">
                    Tambah pelanggan baru sekarang
                  </span>
                </div>
              }
            >
              {customers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-surface-container-lowest transition-colors group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-md font-bold text-lg shrink-0 ${index % 2 === 0 ? "bg-primary-container text-primary" : "bg-secondary-container text-secondary"}`}
                      >
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-background group-hover:text-primary transition-colors">
                          {customer.name}
                        </p>
                        <a
                          href={`https://wa.me/${customer.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors sm:hidden mt-0.5 flex items-center gap-1 w-fit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            chat
                          </span>
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <a
                      href={`https://wa.me/${customer.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-primary transition-colors w-fit text-on-surface-variant"
                      title="Chat via WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chat
                      </span>
                      {customer.phone}
                    </a>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {customer.address ? (
                      <div
                        className="flex items-center gap-2 max-w-[200px] truncate text-on-surface-variant"
                        title={customer.address}
                      >
                        <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
                          location_on
                        </span>
                        <span className="truncate">{customer.address}</span>
                      </div>
                    ) : (
                      <span className="italic text-outline">
                        - Belum ada alamat -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        customer.orderCount && customer.orderCount > 0
                          ? "primary"
                          : "default"
                      }
                    >
                      {customer.orderCount || 0} Orders
                    </Chip>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content="Edit">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(customer)}
                          className="text-outline hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Hapus">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleDelete(customer.id)}
                          disabled={deletingId === customer.id}
                          className="text-outline hover:text-error"
                        >
                          <span
                            className={
                              deletingId === customer.id
                                ? "material-symbols-outlined animate-spin text-[20px]"
                                : "material-symbols-outlined text-[20px]"
                            }
                          >
                            {deletingId === customer.id
                              ? "progress_activity"
                              : "delete"}
                          </span>
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination Footer */}
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div>
            Menampilkan {customers.length} dari {totalItems} pelanggan
          </div>
          <Pagination
            total={totalPages}
            page={page}
            onChange={(newPage) => setPage(newPage)}
            size="sm"
            variant="flat"
            color="primary"
          />
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
        onSubmit={handleSubmit}
        isSubmitDisabled={!formData.name || !formData.phone || isSubmitting}
        isLoading={isSubmitting}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            label="Nama Lengkap"
            placeholder="Masukkan nama pelanggan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            variant="bordered"
          />
          <Input
            type="tel"
            label="Nomor Telepon"
            placeholder="Contoh: 628123456789"
            value={formData.phone}
            onChange={handlePhoneChange}
            variant="bordered"
          />
          <Textarea
            label="Alamat Lengkap"
            placeholder="Masukkan alamat pelanggan"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            variant="bordered"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, data: null })}
        onConfirm={onConfirmDelete}
        title="Hapus Pelanggan"
        message="Apakah Anda yakin ingin menghapus pelanggan ini? Data yang sudah dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
