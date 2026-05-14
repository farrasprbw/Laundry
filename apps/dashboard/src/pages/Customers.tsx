import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import apiClient from '../lib/api-client';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await apiClient.get('/customers', {
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
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, page, sortOrder]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    
    // Convert leading 0 to 62 for Indonesian numbers (useful for WhatsApp)
    if (value.startsWith('0')) {
      value = '62' + value.slice(1);
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
        await apiClient.post('/customers', formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      alert(error.response?.data?.error || 'Gagal menyimpan data pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) return;
    try {
      await apiClient.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Gagal menghapus data pelanggan');
    }
  };

  // Open Modal for Edit
  const openEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setSelectedCustomerId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
    });
    setIsModalOpen(true);
  };

  // Open Modal for Create
  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedCustomerId(null);
    setFormData({ name: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mt-16 w-full flex flex-col gap-8">
      {/* Page Header: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
            <span className="text-primary text-4xl">👥</span> Pelanggan
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola data pelanggan dan riwayat transaksi.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 text-label-md font-label-md whitespace-nowrap self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Pelanggan
        </button>
      </div>

      {/* Filters & Search Bar Section */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Specific Customer Search */}
        <div className="w-full sm:w-96 flex items-center bg-surface-bright border border-outline-variant/50 rounded-lg px-4 py-2.5 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
          <input 
            className="bg-transparent border-none outline-none text-body-md font-body-md w-full placeholder-outline text-on-surface focus:ring-0 p-0" 
            placeholder="Cari nama atau nomor telepon..." 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Auxiliary Filters */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={`px-4 py-2 rounded-lg border text-label-md font-label-md transition-colors flex items-center gap-2 whitespace-nowrap ${sortOrder === 'asc' ? 'border-primary text-primary bg-primary-container/10' : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
            </span>
            {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Nama Pelanggan</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Nomor Telepon</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Alamat</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Total Order</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-body-md font-body-md text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Memuat data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr className="hover:bg-surface-container-lowest transition-colors cursor-pointer group border-t-2 border-dashed border-outline-variant/30" onClick={openCreateModal}>
                  <td className="px-6 py-8 text-center" colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[32px] opacity-70">person_add</span>
                      <p className="text-body-md font-body-md font-medium">Belum menemukan pelanggan?</p>
                      <span className="text-label-sm font-label-sm text-primary">Tambah pelanggan baru sekarang</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-md font-bold text-lg shrink-0 ${index % 2 === 0 ? 'bg-primary-container text-primary' : 'bg-secondary-container text-secondary'}`}>
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-background group-hover:text-primary transition-colors">{customer.name}</p>
                          <a 
                            href={`https://wa.me/${customer.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors sm:hidden mt-0.5 flex items-center gap-1 w-fit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant hidden sm:table-cell">
                      <a 
                        href={`https://wa.me/${customer.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-primary transition-colors w-fit"
                        title="Chat via WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        {customer.phone}
                      </a>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant hidden sm:table-cell">
                      {customer.address ? (
                        <div className="flex items-center gap-2 max-w-[200px] truncate" title={customer.address}>
                          <span className="material-symbols-outlined text-[16px] text-outline shrink-0">location_on</span>
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="italic text-outline">- Belum ada alamat -</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-label-sm font-label-sm font-bold border ${customer.orderCount && customer.orderCount > 0 ? 'bg-surface-variant text-on-surface border-outline-variant/30' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}>
                        {customer.orderCount || 0} Orders
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors" 
                          title="Delete"
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
        {/* Table Pagination Footer */}
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div>Menampilkan {customers.length} dari {totalItems} pelanggan</div>
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

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
        onSubmit={handleSubmit}
        isSubmitDisabled={!formData.name || !formData.phone || isSubmitting}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Masukkan nama pelanggan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Nomor Telepon</label>
            <input
              type="tel"
              placeholder="Contoh: 628123456789"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Alamat Lengkap</label>
            <textarea
              placeholder="Masukkan alamat pelanggan"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
}
