import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

interface Order {
  id: string;
  invoiceNumber: string;
  customer?: { id: string; name: string; phone: string };
  category?: { id: string; name: string; unit: string };
  quantity: string;
  totalPrice: number;
  status: 'PROCESS' | 'FINISHED' | 'TAKEN';
  createdAt: string;
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/orders', {
        params: {
          status: statusFilter || undefined,
          page,
          limit: 10,
        },
      });
      setOrders(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus order ini?')) return;
    try {
      await apiClient.delete(`/orders/${id}`);
      fetchOrders();
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
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
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
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">Memuat data...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada order ditemukan.</td>
                </tr>
              ) : (
                orders.map((order, index) => (
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
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface">{Number(order.quantity)} {order.category?.unit || 'kg'}</td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">{formatDate(order.createdAt)}</td>
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
                          >
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </button>
                        )}
                        {order.status === 'FINISHED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'TAKEN')}
                            className="p-2 text-outline hover:text-secondary hover:bg-secondary-container/30 rounded-lg transition-colors"
                            title="Tandai Diambil"
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

