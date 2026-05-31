import { useState, useEffect } from "react";
import apiClient from "../lib/api-client";
import {
  useOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  useUpdatePaymentStatus,
} from "../hooks/use-orders";
import type { Order, UserRole } from "../types/api";
import { usePrinter } from "../hooks/use-printer";
import type { ReceiptData } from "../utils/receipt-builder";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { EditOrderModal } from "../components/ui/EditOrderModal";
import { useSession } from "../hooks/use-auth";
import {
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { useAlert } from "../contexts/AlertContext";

export function Orders() {
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    data: string | null;
  }>({ open: false, data: null });

  const { showAlert } = useAlert();
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const { data, isLoading, refetch } = useOrders(
    {
      status: statusFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
      search: searchFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      page,
      limit: 10,
    },
    15000,
  ); // Auto-refresh every 15 seconds

  // Countdown ticker — re-renders every second for live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = data?.data || [];
  const totalPages = data?.pagination.totalPages || 1;
  const totalItems = data?.pagination.total || 0;

  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const deleteOrder = useDeleteOrder();
  const {
    error: printerError,
    deviceName,
    isSupported: isPrinterSupported,
    isConnected: isPrinterConnected,
    isPrinting,
    isConnecting,
    connect: connectPrinter,
    disconnect: disconnectPrinter,
    printReceipt,
    clearError: clearPrinterError,
  } = usePrinter();

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      // Auto-trigger WA notification when order becomes FINISHED
      if (newStatus === "FINISHED") {
        handleSendWA(id);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showAlert(err.response?.data?.error || "Gagal mengubah status", "danger");
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: string) => {
    try {
      await updatePaymentStatus.mutateAsync({ id, paymentStatus: newStatus });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showAlert(err.response?.data?.error || "Gagal mengubah status pembayaran", "danger");
    }
  };

  const { data: session } = useSession();
  const userRole = ((session?.user as { role?: string })?.role as UserRole) || 'worker';

  const getDropdownItems = (order: Order) => {
    const items = [];
    const canEdit = userRole === 'super_admin' || userRole === 'admin' || order.status === 'PROCESS';
    
    if (canEdit) {
      items.push({
        key: "edit",
        label: "Edit Order",
        icon: "edit",
        action: () => setEditOrder(order),
      });
    }
    if (order.status === "PROCESS")
      items.push({
        key: "finish",
        label: "Tandai Selesai",
        icon: "check_circle",
        action: () => handleUpdateStatus(order.id, "FINISHED"),
      });
    if (order.status === "FINISHED")
      items.push({
        key: "take",
        label: "Tandai Diambil",
        icon: "inventory_2",
        action: () => handleUpdateStatus(order.id, "TAKEN"),
      });
    if (order.paymentStatus !== "PAID")
      items.push({
        key: "pay",
        label: "Tandai Lunas",
        icon: "payments",
        action: () => handleUpdatePaymentStatus(order.id, "PAID"),
      });
    if (order.status === "FINISHED")
      items.push({
        key: "print",
        label: "Cetak Struk",
        icon: "print",
        action: () => handlePrint(order),
      });
    if (order.status === "FINISHED")
      items.push({
        key: "wa",
        label: "Kirim Notif WA",
        icon: "chat",
        action: () => handleSendWA(order.id),
      });
    items.push({
      key: "delete",
      label: "Hapus Order",
      icon: "delete",
      action: () => handleDelete(order.id),
      isDanger: true,
    });
    return items;
  };

  const handleDelete = (id: string) => {
    setConfirmState({ open: true, data: id });
  };

  const onConfirmDelete = async () => {
    if (!confirmState.data) return;
    try {
      await deleteOrder.mutateAsync(confirmState.data);
      setConfirmState({ open: false, data: null });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showAlert(err.response?.data?.error || "Gagal menghapus order", "danger");
    }
  };

  const handleSendWA = async (id: string, silent = false) => {
    try {
      await apiClient.post(`/orders/${id}/wa-send`);
      if (!silent) showAlert("Pesan WhatsApp berhasil dikirim di latar belakang!", "success");
    } catch (error: unknown) {
      if (!silent) showAlert("Gagal mengirim notifikasi WhatsApp otomatis.", "danger");
    }
  };

  const handlePrint = async (order: Order) => {
    if (!isPrinterConnected) {
      showAlert(
        'Printer belum terhubung. Klik "Hubungkan Printer" terlebih dahulu.',
        "warning"
      );
      return;
    }

    try {
      // Fetch full order detail (includes category with pricePerUnit and estimatedDurationDays)
      const response = await apiClient.get(`/orders/${order.id}`);
      const fullOrder = response.data;

      const receiptData: ReceiptData = {
        invoiceNumber: fullOrder.invoiceNumber,
        customerName: fullOrder.customer?.name || "Unknown",
        categoryName: fullOrder.category?.name || "Laundry",
        quantity: parseFloat(fullOrder.quantity),
        unit: fullOrder.category?.unit || "kg",
        pricePerUnit: fullOrder.category?.pricePerUnit || 0,
        totalPrice: fullOrder.totalPrice,
        paymentStatus: fullOrder.paymentStatus,
        discount: 0,
        createdAt: fullOrder.createdAt,
        estimatedDurationDays: fullOrder.category?.estimatedDurationDays,
        notes: fullOrder.notes,
      };

      const success = await printReceipt(receiptData);
      if (success) {
        // Brief visual feedback — no alert needed, printer status shows it
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      showAlert("Gagal mencetak struk: " + (err.message || "Unknown error"), "danger");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateString));
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getPrinterStatusBadge = () => {
    if (!isPrinterSupported) {
      return (
        <Chip
          size="sm"
          color="danger"
          variant="flat"
          startContent={
            <span className="material-symbols-outlined text-[14px] mr-1">
              error
            </span>
          }
        >
          Browser Tidak Support
        </Chip>
      );
    }

    if (isPrinting) {
      return (
        <Chip
          size="sm"
          color="warning"
          variant="flat"
          classNames={{ content: "animate-pulse" }}
        >
          Mencetak...
        </Chip>
      );
    }

    if (isConnecting) {
      return (
        <Chip
          size="sm"
          color="primary"
          variant="flat"
          classNames={{ content: "animate-pulse" }}
        >
          Menghubungkan...
        </Chip>
      );
    }

    if (isPrinterConnected) {
      return (
        <Chip
          size="sm"
          color="success"
          variant="flat"
          startContent={
            <span className="material-symbols-outlined text-[14px] mr-1">
              bluetooth_connected
            </span>
          }
        >
          {deviceName || "Terhubung"}
        </Chip>
      );
    }

    return (
      <Chip
        size="sm"
        color="default"
        variant="flat"
        startContent={
          <span className="material-symbols-outlined text-[14px] mr-1">
            bluetooth_disabled
          </span>
        }
      >
        Tidak Terhubung
      </Chip>
    );
  };

  return (
    <div className="pt-24 pb-container-padding-desktop px-container-padding-desktop flex-1 space-y-stack-lg w-full">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">
              receipt_long
            </span>
            Orders
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">
            Manage and track all laundry processing phases.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Printer Status & Controls */}
          <div className="flex items-center gap-2">
            {getPrinterStatusBadge()}
            {isPrinterSupported &&
              (isPrinterConnected ? (
                <Button
                  onPress={disconnectPrinter}
                  variant="bordered"
                  className="px-3 py-2 rounded-xl text-label-md font-label-md border-outline-variant/30 text-on-surface-variant hover:bg-error-container hover:text-error hover:border-error/30"
                  startContent={<span className="material-symbols-outlined text-[18px]">bluetooth_disabled</span>}
                  title="Putuskan Printer"
                >
                  <span className="hidden sm:inline">Putuskan</span>
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={connectPrinter}
                  isDisabled={isConnecting}
                  className="px-3 py-2 rounded-xl text-label-md font-label-md shadow-sm text-white"
                  startContent={<span className="material-symbols-outlined text-[18px]">print</span>}
                  title="Hubungkan Printer Bluetooth"
                >
                  <span className="hidden sm:inline">{isConnecting ? "Menghubungkan..." : "Hubungkan Printer"}</span>
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20">
        <div className="flex-1 w-full sm:w-auto min-w-[200px]">
          <label className="text-xs text-on-surface-variant font-medium mb-1 block">Pencarian</label>
          <input
            type="text"
            placeholder="Cari Invoice atau Pelanggan..."
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-lg border border-outline-variant/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">Dari Tanggal</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto h-10 px-3 rounded-lg border border-outline-variant/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">Sampai Tanggal</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto h-10 px-3 rounded-lg border border-outline-variant/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
          
          <div className="flex-1 min-w-[120px] w-full sm:w-32">
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">Pembayaran</label>
            <Select
              aria-label="Filter Payment Status"
              placeholder="Semua"
              selectedKeys={paymentStatusFilter ? [paymentStatusFilter] : []}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full"
              variant="bordered"
              size="sm"
            >
              <SelectItem key="" value="">Semua</SelectItem>
              <SelectItem key="PAID" value="PAID">Lunas</SelectItem>
              <SelectItem key="UNPAID" value="UNPAID">Belum Lunas</SelectItem>
            </Select>
          </div>

          <div className="flex-1 min-w-[120px] w-full sm:w-32">
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">Status Order</label>
            <Select
              aria-label="Filter Status"
              placeholder="Semua"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full"
              variant="bordered"
              size="sm"
            >
              <SelectItem key="" value="">Semua</SelectItem>
              <SelectItem key="PROCESS" value="PROCESS">Process</SelectItem>
              <SelectItem key="FINISHED" value="FINISHED">Finished</SelectItem>
              <SelectItem key="TAKEN" value="TAKEN">Taken</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Printer Error Banner */}
      {printerError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-error-container/30 border border-error/20 text-error">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span className="text-body-md font-body-md flex-1">
            {printerError}
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={clearPrinterError}
            className="text-error hover:bg-error/10"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </Button>
        </div>
      )}

      {/* Unnotified Finished Orders Banner */}
      {(() => {
        const unnotifiedOrders = orders.filter(
          (o: Order) => o.status === "FINISHED" && !o.waNotificationSent
        );
        if (unnotifiedOrders.length === 0) return null;
        return (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-container/30 border border-secondary/20 text-secondary">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span className="text-body-md font-body-md flex-1">
              <strong>{unnotifiedOrders.length} order</strong> selesai dan belum dikirim notifikasi WhatsApp.
            </span>
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              className="whitespace-nowrap"
              startContent={<span className="material-symbols-outlined text-[16px]">send</span>}
              onPress={async () => {
                for (const order of unnotifiedOrders) {
                  await handleSendWA(order.id, true);
                }
                showAlert(`Berhasil mengirim ${unnotifiedOrders.length} pesan WhatsApp!`, "success");
                refetch();
              }}
            >
              Kirim Semua
            </Button>
          </div>
        );
      })()}

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
        <div className="overflow-x-auto w-full">
          <Table
            aria-label="Orders Table"
            removeWrapper
            shadow="none"
            className="min-w-max w-full"
          >
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                ID
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Customer
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Category
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Qty
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Total
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Date
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Payment
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Status
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                Aksi
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={<Spinner label="Memuat order..." />}
              emptyContent="Tidak ada order ditemukan."
            >
              {orders.map((order: Order, index: number) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-surface-container-lowest transition-colors group"
                >
                  <TableCell className="text-label-md font-label-md text-primary">
                    {order.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm ${index % 2 === 0 ? "bg-primary-container text-primary" : "bg-secondary-container text-secondary"}`}
                      >
                        {order.customer
                          ? getInitials(order.customer.name)
                          : "NN"}
                      </div>
                      <span className="text-body-md font-body-md text-on-surface">
                        {order.customer?.name || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-body-md font-body-md text-on-surface-variant">
                    {order.category?.name || "-"}
                  </TableCell>
                  <TableCell className="text-body-md font-body-md text-on-surface">
                    {parseFloat(order.quantity)} {order.category?.unit || "kg"}
                  </TableCell>
                  <TableCell className="text-body-md font-body-md text-on-surface">
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  <TableCell className="text-body-md font-body-md text-on-surface-variant">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-body-md font-body-md text-on-surface">
                        {order.paymentMethod?.name || "-"}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${order.paymentStatus === "PAID" ? "text-secondary" : "text-error"}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.status === "PROCESS" &&
                      (() => {
                        const estDays = order.category?.estimatedDurationDays;
                        if (estDays) {
                          const createdAtDate = new Date(order.createdAt);
                          const targetDate = new Date(createdAtDate);
                          targetDate.setDate(
                            targetDate.getDate() + (estDays - 1),
                          );
                          targetDate.setHours(17, 0, 0, 0);

                          const finishTime = targetDate.getTime();
                          const remaining = Math.max(
                            0,
                            finishTime - Date.now(),
                          );
                          if (remaining > 0) {
                            const days = Math.floor(
                              remaining / (1000 * 60 * 60 * 24),
                            );
                            const hrs = Math.floor(
                              (remaining % (1000 * 60 * 60 * 24)) / 3600000,
                            );
                            const mins = Math.floor(
                              (remaining % 3600000) / 60000,
                            );
                            const secs = Math.floor((remaining % 60000) / 1000);
                            const timeStr =
                              days > 0
                                ? `${days}h ${hrs}j ${mins}m`
                                : hrs > 0
                                  ? `${hrs}j ${mins}m ${secs}d`
                                  : mins > 0
                                    ? `${mins}m ${secs}d`
                                    : `${secs}d`;
                            return (
                              <div className="flex flex-col gap-1">
                                <Chip
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  startContent={
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse"></span>
                                  }
                                >
                                  Process
                                </Chip>
                                <span className="text-[10px] text-on-surface-variant font-mono whitespace-nowrap">
                                  ⏱ {timeStr}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex flex-col gap-1">
                                <Chip
                                  size="sm"
                                  color="warning"
                                  variant="flat"
                                  startContent={
                                    <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">
                                      autorenew
                                    </span>
                                  }
                                >
                                  Auto-finish...
                                </Chip>
                              </div>
                            );
                          }
                        }
                        return (
                          <Chip
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse"></span>
                            }
                          >
                            Process
                          </Chip>
                        );
                      })()}
                    {order.status === "FINISHED" && (
                      <Chip
                        size="sm"
                        color="secondary"
                        variant="flat"
                        startContent={
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            check_circle
                          </span>
                        }
                      >
                        Finished
                      </Chip>
                    )}
                    {order.status === "TAKEN" && (
                      <Chip
                        size="sm"
                        color="default"
                        variant="flat"
                        startContent={
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            inventory_2
                          </span>
                        }
                      >
                        Taken
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            more_vert
                          </span>
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Order Actions"
                        variant="flat"
                        items={getDropdownItems(order)}
                      >
                        {(item: { key: string; label: string; icon: string; action: () => void; isDanger?: boolean }) => (
                          <DropdownItem
                            key={item.key}
                            color={item.isDanger ? "danger" : "default"}
                            className={item.isDanger ? "text-danger" : ""}
                            onPress={item.action}
                            startContent={
                              <span className="material-symbols-outlined text-[18px]">
                                {item.icon}
                              </span>
                            }
                          >
                            {item.label}
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination Footer */}
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div>
            Menampilkan {orders.length} dari {totalItems} order
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

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, data: null })}
        title="Hapus Order"
        message="Apakah Anda yakin ingin menghapus order ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={onConfirmDelete}
        isLoading={deleteOrder.isPending}
        confirmText="Hapus Order"
      />
      <EditOrderModal
        isOpen={!!editOrder}
        onClose={() => setEditOrder(null)}
        order={editOrder}
      />
    </div>
  );
}
