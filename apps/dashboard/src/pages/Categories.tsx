import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/use-categories';
import type { Category } from '../types/api';
import { Button, Input, Select, SelectItem, Spinner, Tooltip } from '@nextui-org/react';

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
  const [estimatedDays, setEstimatedDays] = useState('1');

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setPrice('');
    setUnit('kg');
    setEstimatedDays('1');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setPrice(category.pricePerUnit.toString());
    setUnit(category.unit || 'kg');
    setEstimatedDays(category.estimatedDurationDays.toString());
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
      estimatedDurationDays: Number(estimatedDays)
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
    <div className="pt-24 px-container-padding-mobile md:px-container-padding-desktop pb-24 md:pb-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl fill-icon">sell</span>
            Kategori Laundry
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola jenis layanan dan harga dasar per kilogram.</p>
        </div>
        <Button
          color="primary"
          onPress={openAddModal}
          startContent={<span className="material-symbols-outlined">add</span>}
          className="rounded-xl py-6 px-5 shadow-md text-label-md font-label-md text-white"
        >
          Tambah Kategori
        </Button>
      </div>

      {/* Bento Grid Canvas for Categories */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner label="Memuat kategori..." />
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
                    <Tooltip content="Edit">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openEditModal(category)}
                        className="text-on-surface-variant hover:text-primary animate-fadeIn"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Hapus">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openDeleteModal(category)}
                        className="text-on-surface-variant hover:text-error animate-fadeIn"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </Button>
                    </Tooltip>
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
                      <span className="text-label-md font-label-md">{category.estimatedDurationDays} Hari</span>
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
          <Input
            type="text"
            label="Nama Kategori"
            placeholder="Contoh: Cuci Kilat"
            isRequired
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="bordered"
          />
          <Input
            type="text"
            label="Deskripsi (Opsional)"
            placeholder="Contoh: Layanan Cepat"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="bordered"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Harga"
              placeholder="0"
              isRequired
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              variant="bordered"
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">Rp</span>
                </div>
              }
            />
            <Select
              label="Satuan"
              selectedKeys={unit ? [unit] : []}
              onChange={(e) => setUnit(e.target.value)}
              variant="bordered"
            >
              <SelectItem key="kg" value="kg">Per Kilogram (/kg)</SelectItem>
              <SelectItem key="pc" value="pc">Per Pcs (/pc)</SelectItem>
              <SelectItem key="unit" value="unit">Per Unit (/unit)</SelectItem>
            </Select>
          </div>

          <Input
            type="number"
            label="Estimasi Waktu (Hari)"
            placeholder="Contoh: 1"
            min="1"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            variant="bordered"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        isLoading={deleteCategory.isPending}
        confirmText="Hapus Kategori"
      />
    </div>
  );
}
