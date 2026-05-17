import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../hooks/use-orders';
import { usePrinter } from '../hooks/use-printer';
import type { ReceiptData } from '../utils/receipt-builder';

export function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    status: statusFilter || undefined,
    page,
    limit: 10,
  }, 60000); // Auto-refresh every 60 seconds

  // Countdown ticker — re-renders every second for live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = data?.data || [];
  const totalPages = data?.pagination.totalPages || 1;
  const totalItems = data?.pagination.total || 0;

  const updateStatus = useUpdateOrderStatus();
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
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus order ini?')) return;
    try {
      await deleteOrder.mutateAsync(id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus order');
    }
  };

  const handleSendWA = async (id: string) => {
    try {
      const response = await apiClient.get(`/orders/${id}/wa-link`);
      window.open(response.data.waLink, '_blank');
    } catch (error: any) {
      alert('Gagal membuat link WhatsApp');
    }
  };

  const handlePrint = async (order: any) => {
    if (!isPrinterConnected) {
      alert('Printer belum terhubung. Klik "Hubungkan Printer" terlebih dahulu.');
      return;
    }

    try {
      // Fetch full order detail (includes category with pricePerUnit and estimatedDurationMinutes)
      const response = await apiClient.get(`/orders/${order.id}`);
      const fullOrder = response.data;

      const receiptData: ReceiptData = {
        invoiceNumber: fullOrder.invoiceNumber,
        customerName: fullOrder.customer?.name || 'Unknown',
        categoryName: fullOrder.category?.name || 'Laundry',
        quantity: parseFloat(fullOrder.quantity),
        unit: fullOrder.category?.unit || 'kg',
        pricePerUnit: fullOrder.category?.pricePerUnit || 0,
        totalPrice: fullOrder.totalPrice,
        paymentStatus: fullOrder.paymentStatus,
        discount: 0,
        createdAt: fullOrder.createdAt,
        estimatedDurationMinutes: fullOrder.category?.estimatedDurationMinutes,
        notes: fullOrder.notes,
      };

      const success = await printReceipt(receiptData);
      if (success) {
        // Brief visual feedback — no alert needed, printer status shows it
      }
    } catch (error: any) {
      alert('Gagal mencetak struk: ' + (error.message || 'Unknown error'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(dateString));
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getPrinterStatusBadge = () => {
    if (!isPrinterSupported) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-error-container text-on-error-container">
          <span className="material-symbols-outlined text-[14px] mr-1">error</span>
          Browser Tidak Support
        </span>
      );
    }

    if (isPrinting) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-tertiary-container text-on-tertiary-container">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1.5 animate-pulse"></span>
          Mencetak...
        </span>
      );
    }

    if (isConnecting) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
          Menghubungkan...
        </span>
      );
    }

    if (isPrinterConnected) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
          <span className="material-symbols-outlined text-[14px] mr-1">bluetooth_connected</span>
          {deviceName || 'Terhubung'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-variant text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px] mr-1">bluetooth_disabled</span>
        Tidak Terhubung
      </span>
    );
  };

  return (
    <div className="mt-16 p-container-padding-desktop flex-1 space-y-stack-lg">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">receipt_long</span>
            Orders
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Manage and track all laundry processing phases.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Printer Status & Controls */}
          <div className="flex items-center gap-2">
            {getPrinterStatusBadge()}
            {isPrinterSupported && (
              isPrinterConnected ? (
                <button
                  onClick={disconnectPrinter}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-label-md font-label-md border border-outline-variant/30 text-on-surface-variant hover:bg-error-container/30 hover:text-error hover:border-error/30 transition-colors"
                  title="Putuskan Printer"
                >
                  <span className="material-symbols-outlined text-[18px]">bluetooth_disabled</span>
                  <span className="hidden sm:inline">Putuskan</span>
                </button>
              ) : (
                <button
                  onClick={connectPrinter}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-label-md font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                  title="Hubungkan Printer Bluetooth"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span className="hidden sm:inline">
                    {isConnecting ? 'Menghubungkan...' : 'Hubungkan Printer'}
                  </span>
                </button>
              )
            )}
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 pr-10 text-label-md font-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="PROCESS">Process</option>
              <option value="FINISHED">Finished</option>
              <option value="TAKEN">Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printer Error Banner */}
      {printerError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-error-container/30 border border-error/20 text-error">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span className="text-body-md font-body-md flex-1">{printerError}</span>
          <button onClick={clearPrinterError} className="p-1 hover:bg-error/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-h-[250px]">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-body-md font-body-md text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">Memuat data...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada order ditemukan.</td>
                </tr>
              ) : (
                orders.map((order: any, index: number) => (
                  <tr key={order.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4 text-label-md font-label-md text-primary">{order.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm ${index % 2 === 0 ? 'bg-primary-container text-primary' : 'bg-secondary-container text-secondary'}`}>
                          {order.customer ? getInitials(order.customer.name) : 'NN'}
                        </div>
                        <span className="text-body-md font-body-md text-on-surface">{order.customer?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">{order.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface">{parseFloat(order.quantity)} {order.category?.unit || 'kg'}</td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body-md font-body-md text-on-surface">{order.paymentMethod?.name || '-'}</span>
                        <span className={`text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'text-secondary' : 'text-error'}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'PROCESS' && (() => {
                        const est = order.category?.estimatedDurationMinutes;
                        if (est) {
                          const finishTime = new Date(order.createdAt).getTime() + est * 60 * 1000;
                          const remaining = Math.max(0, finishTime - Date.now());
                          if (remaining > 0) {
                            const hrs = Math.floor(remaining / 3600000);
                            const mins = Math.floor((remaining % 3600000) / 60000);
                            const secs = Math.floor((remaining % 60000) / 1000);
                            const timeStr = hrs > 0 ? `${hrs}j ${mins}m ${secs}d` : mins > 0 ? `${mins}m ${secs}d` : `${secs}d`;
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
                                  Process
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-mono">
                                  ⏱ {timeStr}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-tertiary-container text-on-tertiary-container">
                                  <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">autorenew</span>
                                  Auto-finish...
                                </span>
                              </div>
                            );
                          }
                        }
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
                            Process
                          </span>
                        );
                      })()}
                      {order.status === 'FINISHED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
                          <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                          Finished
                        </span>
                      )}
                      {order.status === 'TAKEN' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-variant text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px] mr-1">inventory_2</span>
                          Taken
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Status Update Button */}
                        {order.status === 'PROCESS' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'FINISHED')}
                            className="p-2 text-outline hover:text-secondary hover:bg-secondary-container/30 rounded-lg transition-colors"
                            title="Tandai Selesai"
                            disabled={updateStatus.isPending}
                          >
                            <span className={updateStatus.isPending && updateStatus.variables?.id === order.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                              {updateStatus.isPending && updateStatus.variables?.id === order.id ? 'progress_activity' : 'check_circle'}
                            </span>
                          </button>
                        )}
                        {order.status === 'FINISHED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'TAKEN')}
                            className="p-2 text-outline hover:text-secondary hover:bg-secondary-container/30 rounded-lg transition-colors"
                            title="Tandai Diambil"
                            disabled={updateStatus.isPending}
                          >
                            <span className={updateStatus.isPending && updateStatus.variables?.id === order.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                              {updateStatus.isPending && updateStatus.variables?.id === order.id ? 'progress_activity' : 'inventory_2'}
                            </span>
                          </button>
                        )}
                        {/* Print Receipt Button — Only for FINISHED orders */}
                        {order.status === 'FINISHED' && (
                          <button
                            onClick={() => handlePrint(order)}
                            className={`p-2 rounded-lg transition-colors ${
                              isPrinterConnected
                                ? 'text-outline hover:text-tertiary hover:bg-tertiary-container/30'
                                : 'text-outline/40 cursor-not-allowed'
                            }`}
                            title={isPrinterConnected ? 'Cetak Struk' : 'Hubungkan printer terlebih dahulu'}
                            disabled={!isPrinterConnected || isPrinting}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isPrinting ? 'hourglass_top' : 'print'}
                            </span>
                          </button>
                        )}
                        {/* WhatsApp Notification Button */}
                        {order.status === 'FINISHED' && (
                          <button
                            onClick={() => handleSendWA(order.id)}
                            className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors"
                            title="Kirim Notif WA"
                          >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                          </button>
                        )}
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                          title="Hapus"
                          disabled={deleteOrder.isPending}
                        >
                          <span className={deleteOrder.isPending && deleteOrder.variables === order.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                            {deleteOrder.isPending && deleteOrder.variables === order.id ? 'progress_activity' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div>Menampilkan {orders.length} dari {totalItems} order</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-outline-variant/50 text-outline hover:bg-surface hover:text-on-surface disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-outline-variant/50 text-outline hover:bg-surface hover:text-on-surface disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
