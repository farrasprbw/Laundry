import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '../hooks/use-payment-methods';
import { Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner, Tooltip } from '@nextui-org/react';

export function PaymentMethods() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [editingMethod, setEditingMethod] = useState<{ id: string; name: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean, data: { id: string, name: string } | null }>({ open: false, data: null });

  const { data: methods = [], isLoading, error } = usePaymentMethods();
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const closeModal = () => {
    setIsModalOpen(false);
    setNewMethodName('');
    setEditingMethod(null);
  };

  const handleSubmit = async () => {
    if (newMethodName.trim()) {
      try {
        if (editingMethod) {
          await updateMutation.mutateAsync({ id: editingMethod.id, name: newMethodName.trim() });
        } else {
          await createMutation.mutateAsync({ name: newMethodName.trim() });
        }
        closeModal();
      } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
        alert(err?.response?.data?.error || `Gagal ${editingMethod ? 'mengubah' : 'menambahkan'} metode pembayaran`);
      }
    }
  };

  const openEditModal = (method: { id: string; name: string }) => {
    setEditingMethod(method);
    setNewMethodName(method.name);
    setIsModalOpen(true);
  };
  const toggleMethodStatus = async (id: string, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, isActive: !currentActive });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      alert(err?.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmState({ open: true, data: { id, name } });
  };

  const onConfirmDelete = async () => {
    if (!confirmState.data) return;
    try {
      await deleteMutation.mutateAsync(confirmState.data.id);
      setConfirmState({ open: false, data: null });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      alert(err?.response?.data?.error || 'Gagal menghapus metode pembayaran');
    }
  };

  return (
    <div className="pt-24 px-container-padding-mobile md:px-container-padding-desktop pb-24 md:pb-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
            Payment Methods
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola metode pembayaran yang tersedia.</p>
        </div>
        <Button
          color="primary"
          onPress={() => {
            closeModal(); // Reset any existing state before opening for add
            setIsModalOpen(true);
          }}
          startContent={<span className="material-symbols-outlined">add</span>}
          className="rounded-xl py-6 px-5 shadow-md text-label-md font-label-md text-white"
        >
          Tambah Metode
        </Button>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner label="Memuat metode pembayaran..." />
        </div>
      )}

      {error && (
        <div className="bg-error-container/30 border border-error/30 rounded-xl p-6 text-center">
          <p className="text-error font-label-md">Gagal memuat data payment methods</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
          <div className="overflow-x-auto w-full">
            <Table aria-label="Payment Methods Table" removeWrapper shadow="none" className="min-w-max w-full">
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Nama Metode</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Belum ada metode pembayaran.">
              {methods.map((method) => (
                <TableRow key={method.id} className="hover:bg-surface-container-lowest transition-colors group">
                  <TableCell className="font-medium text-on-background">
                    {method.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      as="button"
                      onClick={() => toggleMethodStatus(method.id, method.isActive)}
                      isDisabled={updateMutation.isPending}
                      size="sm"
                      variant="flat"
                      color={method.isActive ? "primary" : "default"}
                      className="cursor-pointer font-bold border hover:opacity-80 transition-opacity"
                    >
                      {method.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content="Edit">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(method)}
                          className="text-outline hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleDelete(method.id, method.name)}
                          disabled={deleteMutation.isPending}
                          className="text-outline hover:text-error"
                        >
                          <span className={deleteMutation.isPending && deleteMutation.variables === method.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                            {deleteMutation.isPending && deleteMutation.variables === method.id ? 'progress_activity' : 'delete'}
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
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
        onSubmit={handleSubmit}
        isSubmitDisabled={!newMethodName.trim() || createMutation.isPending || updateMutation.isPending}
        isLoading={createMutation.isPending || (updateMutation.isPending && !!editingMethod)}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            label="Metode Pembayaran"
            value={newMethodName}
            onChange={(e) => setNewMethodName(e.target.value)}
            placeholder="Contoh: E-Wallet DANA"
            variant="bordered"
            autoFocus
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, data: null })}
        onConfirm={onConfirmDelete}
        title="Hapus Metode Pembayaran"
        message={`Hapus metode pembayaran "${confirmState.data?.name}"? Aksi ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
