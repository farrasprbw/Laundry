import { useState } from 'react';
import apiClient from '../lib/api-client';
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../hooks/use-orders';

export function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const orders = data?.data || [];
  const totalPages = data?.pagination.totalPages || 1;
  const totalItems = data?.pagination.total || 0;

  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

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

      {/* Bento/Glassmorphism Data Table Container */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse min-h-[250px]">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/20">
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
            <tbody className="divide-y divide-outline-variant/10">
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
                  <tr key={order.id} className="bg-surface hover:bg-surface-container-low transition-colors group">
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
                      {order.status === 'PROCESS' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
                          Process
                        </span>
                      )}
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
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </button>
                        )}
                        {order.status === 'FINISHED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'TAKEN')}
                            className="p-2 text-outline hover:text-secondary hover:bg-secondary-container/30 rounded-lg transition-colors"
                            title="Tandai Diambil"
                            disabled={updateStatus.isPending}
                          >
                            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                          </button>
                        )}
                        {/* WhatsApp Notification Button */}
                        <button
                          onClick={() => handleSendWA(order.id)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors"
                          title="Kirim Notif WA"
                        >
                          <span className="material-symbols-outlined text-[20px]">chat</span>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                          title="Hapus"
                          disabled={deleteOrder.isPending}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-on-surface-variant">Menampilkan {orders.length} dari {totalItems} entries</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
