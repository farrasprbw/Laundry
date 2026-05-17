import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/use-categories';
import type { Category } from '../types/api';

const CARD_THEMES = [
  { lightBg: 'bg-primary/5', containerBg: 'bg-primary-container', iconColor: 'text-primary' },
  { lightBg: 'bg-secondary/5', containerBg: 'bg-secondary-container', iconColor: 'text-on-secondary-container' },
  { lightBg: 'bg-tertiary/5', containerBg: 'bg-tertiary-container', iconColor: 'text-on-tertiary-container' },
];

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('setrika')) return 'iron';
  if (n.includes('bed') || n.includes('sprei') || n.includes('selimut')) return 'bed';
  if (n.includes('kilat') || n.includes('cepat')) return 'dry_cleaning';
  return 'styler';
};

export function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [estimatedHours, setEstimatedHours] = useState('24');

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setPrice('');
    setUnit('kg');
    setEstimatedHours('24');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setPrice(category.pricePerUnit.toString());
    setUnit(category.unit || 'kg');
    setEstimatedHours((category.estimatedDurationMinutes / 60).toString());
    setIsModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !price) return;

    const payload = {
      name,
      description: description || undefined,
      icon: getCategoryIcon(name),
      pricePerUnit: Number(price),
      unit,
      estimatedDurationMinutes: Number(estimatedHours) * 60
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...payload }, {
        onSuccess: () => {
          setIsModalOpen(false);
        }
      });
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          setIsModalOpen(false);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setDeletingCategory(null);
      }
    });
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="pt-24 px-6 md:px-10 pb-24 md:pb-10 max-w-[1440px] w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl fill-icon">sell</span>
            Kategori Laundry
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola jenis layanan dan harga dasar per kilogram.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-on-primary rounded-xl py-3 px-5 flex items-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-md font-label-md text-label-md"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Kategori
        </button>
      </div>

      {/* Bento Grid Canvas for Categories */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-10 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">sell</span>
          <p className="text-body-lg text-on-surface-variant">Belum ada kategori. Silakan tambah kategori baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <div key={category.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex flex-col group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme.lightBg} rounded-bl-full -mr-4 -mt-4 z-0`}></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-full ${theme.containerBg} flex items-center justify-center ${theme.iconColor}`}>
                    <span className="material-symbols-outlined text-2xl">{category.icon || getCategoryIcon(category.name)}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-headline-md font-headline-md text-on-background mb-1">{category.name}</h3>
                  <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-4 h-5">
                    {category.description || ''}
                  </p>
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                      <span className="text-body-md font-body-md text-on-surface-variant">Harga</span>
                      <span className="text-body-md font-body-md font-semibold text-on-background">
                        {formatRupiah(category.pricePerUnit)}
                        <span className="text-label-sm text-on-surface-variant font-normal">/{category.unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                      <span className="text-label-md font-label-md">{Math.round(category.estimatedDurationMinutes / 60)} jam</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
        onSubmit={handleSubmit}
        isSubmitDisabled={!name || !price || createCategory.isPending || updateCategory.isPending}
        isLoading={createCategory.isPending || updateCategory.isPending}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Nama Kategori</label>
            <input
              type="text"
              placeholder="Contoh: Cuci Kilat"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Deskripsi (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Layanan Cepat"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md text-on-surface">Harga</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md font-label-md text-on-surface">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="kg">Per Kilogram (/kg)</option>
                <option value="pc">Per Pcs (/pc)</option>
                <option value="unit">Per Unit (/unit)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Estimasi Waktu (Jam)</label>
            <input
              type="number"
              placeholder="Contoh: 24"
              min="1"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Kategori"
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-md text-on-surface-variant">
            Apakah Anda yakin ingin menghapus kategori <span className="font-semibold text-on-surface">"{deletingCategory?.name}"</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-label-md font-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="text-white px-5 py-2.5 rounded-xl text-label-md font-label-md bg-error hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteCategory.isPending && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {deleteCategory.isPending ? 'Menghapus...' : 'Hapus Kategori'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
