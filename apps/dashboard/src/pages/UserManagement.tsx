import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useUsers, useCreateUser, useUpdateUserRole, useUpdateUser, useDeleteUser } from '../hooks/use-users';
import type { UserRole, UserInfo } from '../types/api';
import { Button, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip } from '@nextui-org/react';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { QueryErrorState } from '../components/ui/QueryErrorState';
import { useAlert } from '../contexts/AlertContext';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  worker: 'Worker',
};


export function UserManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('worker');

  // Edit form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [confirmState, setConfirmState] = useState<{ open: boolean, data: { id: string, name: string } | null }>({ open: false, data: null });

  const { data: users = [], isLoading, error } = useUsers();
  const createMutation = useCreateUser();
  const updateRoleMutation = useUpdateUserRole();
  const updateUserMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const { showAlert } = useAlert();

  const handleCreateUser = async () => {
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: formName.trim(),
        username: formUsername.trim(),
        phone: formPhone.trim(),
        password: formPassword,
        role: formRole,
      });
      setFormName('');
      setFormUsername('');
      setFormPhone('');
      setFormPassword('');
      setFormRole('worker');
      showAlert('Berhasil membuat user baru', 'success');
      setIsCreateModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      showAlert(err?.response?.data?.error || 'Gagal membuat user', "danger");
    }
  };

  const openEditModal = (user: UserInfo) => {
    setEditUserId(user.id);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPhone(user.phone || '');
    setEditPassword('');
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUserId || !editName.trim() || !editUsername.trim()) return;
    try {
      const input: Record<string, string | undefined> = {
        name: editName.trim(),
        username: editUsername.trim(),
        phone: editPhone.trim(),
      };
      if (editPassword) {
        input.password = editPassword;
      }

      await updateUserMutation.mutateAsync({
        id: editUserId,
        input,
      });
      showAlert('Berhasil memperbarui data user', 'success');
      setIsEditModalOpen(false);
      setEditUserId(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      showAlert(err?.response?.data?.error || 'Gagal memperbarui user', "danger");
    }
  };

  const openRoleModal = (userId: string, currentRole: UserRole) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole);
    setIsRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId) return;
    try {
      await updateRoleMutation.mutateAsync({ id: selectedUserId, role: selectedRole });
      showAlert('Berhasil mengubah role user', 'success');
      setIsRoleModalOpen(false);
      setSelectedUserId(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      showAlert(err?.response?.data?.error || 'Gagal mengubah role', "danger");
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    setConfirmState({ open: true, data: { id, name } });
  };

  const onConfirmDelete = async () => {
    if (!confirmState.data) return;
    try {
      await deleteMutation.mutateAsync(confirmState.data.id);
      showAlert('Berhasil menghapus user', 'success');
      setConfirmState({ open: false, data: null });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      showAlert(err?.response?.data?.error || 'Gagal menghapus user', "danger");
    }
  };

  return (
    <div className="pt-24 px-container-padding-mobile md:px-container-padding-desktop pb-24 md:pb-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            User Management
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola user dan role matrix.</p>
        </div>
        <Button
          color="primary"
          onPress={() => setIsCreateModalOpen(true)}
          startContent={<span className="material-symbols-outlined">person_add</span>}
          className="rounded-xl py-6 px-5 shadow-md text-label-md font-label-md text-white"
        >
          Tambah User
        </Button>
      </div>

      {/* Role Matrix Legend */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 p-6 mb-6">
        <h3 className="text-label-md font-label-md text-on-surface-variant mb-4 uppercase tracking-wider">Role Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">shield</span>
            <div>
              <p className="text-label-md font-label-md text-on-background font-bold">Super Admin</p>
              <p className="text-body-sm text-on-surface-variant">Akses semua fitur termasuk User Management</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
            <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">verified_user</span>
            <div>
              <p className="text-label-md font-label-md text-on-background font-bold">Admin</p>
              <p className="text-body-sm text-on-surface-variant">Semua fitur kecuali User Management</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-variant/30 border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mt-0.5">person</span>
            <div>
              <p className="text-label-md font-label-md text-on-background font-bold">Worker</p>
              <p className="text-body-sm text-on-surface-variant">Dashboard, Orders, dan Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="p-6">
          <TableSkeleton rows={4} columns={5} />
        </div>
      )}

      {error && (
        <QueryErrorState error={error as Error} onRetry={() => window.location.reload()} compact />
      )}

      {!isLoading && !error && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden p-6">
          <div className="overflow-x-auto w-full">
            <Table aria-label="User Table" removeWrapper shadow="none" className="min-w-max w-full">
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">User</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Username</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Role</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Dibuat</TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</TableColumn>
            </TableHeader>
            <TableBody emptyContent={
              <EmptyState icon="group_add" title="Belum ada user" description="Tambah user baru untuk memulai." />
            }>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-surface-container-lowest transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-label-md">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-on-background">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant">{u.username}</span>
                      {u.phone && <span className="text-label-sm text-on-surface-variant/70">{u.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        u.role === 'super_admin' ? 'primary' :
                          u.role === 'admin' ? 'secondary' : 'default'
                      }
                      className="font-bold border"
                    >
                      {ROLE_LABELS[u.role]}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-on-surface-variant text-body-sm">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="Edit User">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(u)}
                          className="text-outline hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Ubah Role">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openRoleModal(u.id, u.role)}
                          className="text-outline hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Hapus User">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleDeleteUser(u.id, u.name)}
                          disabled={deleteMutation.isPending}
                          className="text-outline hover:text-error"
                        >
                          <span className={deleteMutation.isPending && deleteMutation.variables === u.id ? "material-symbols-outlined animate-spin text-[20px]" : "material-symbols-outlined text-[20px]"}>
                            {deleteMutation.isPending && deleteMutation.variables === u.id ? 'progress_activity' : 'delete'}
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormName('');
          setFormUsername('');
          setFormPhone('');
          setFormPassword('');
          setFormRole('worker');
          setShowPassword(false);
        }}
        title="Tambah User Baru"
        onSubmit={handleCreateUser}
        isLoading={createMutation.isPending}
        isSubmitDisabled={!formName.trim() || !formUsername.trim() || !formPassword.trim() || createMutation.isPending}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            label="Nama"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nama lengkap"
            variant="bordered"
            autoFocus
          />
          <Input
            type="text"
            label="Username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            placeholder="username"
            variant="bordered"
          />
          <Input
            type="tel"
            label="No. HP"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: 081234567890"
            variant="bordered"
          />
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            variant="bordered"
            endContent={
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowPassword(!showPassword)}
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </Button>
            }
          />
          <Select
            label="Role"
            selectedKeys={formRole ? [formRole] : []}
            onChange={(e) => setFormRole(e.target.value as UserRole)}
            variant="bordered"
          >
            <SelectItem key="worker" value="worker">Worker</SelectItem>
            <SelectItem key="admin" value="admin">Admin</SelectItem>
            <SelectItem key="super_admin" value="super_admin">Super Admin</SelectItem>
          </Select>
        </div>
      </Modal>

      {/* Update Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUserId(null);
        }}
        title="Ubah Role User"
        onSubmit={handleUpdateRole}
        isLoading={updateRoleMutation.isPending}
        isSubmitDisabled={updateRoleMutation.isPending}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Pilih Role Baru"
            selectedKeys={selectedRole ? [selectedRole] : []}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            variant="bordered"
          >
            <SelectItem key="worker" value="worker">Worker</SelectItem>
            <SelectItem key="admin" value="admin">Admin</SelectItem>
            <SelectItem key="super_admin" value="super_admin">Super Admin</SelectItem>
          </Select>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
            <p className="text-label-sm font-label-sm text-on-surface-variant mb-2">Hak Akses Role:</p>
            {selectedRole === 'super_admin' && (
              <p className="text-body-sm text-on-surface">Semua fitur termasuk User Management</p>
            )}
            {selectedRole === 'admin' && (
              <p className="text-body-sm text-on-surface">Semua fitur kecuali User Management</p>
            )}
            {selectedRole === 'worker' && (
              <p className="text-body-sm text-on-surface">Dashboard, Orders, dan Customers</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditUserId(null);
          setEditPassword('');
          setShowEditPassword(false);
        }}
        title="Edit User"
        onSubmit={handleUpdateUser}
        isLoading={updateUserMutation.isPending}
        isSubmitDisabled={!editName.trim() || !editUsername.trim() || updateUserMutation.isPending}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            label="Nama"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nama lengkap"
            variant="bordered"
          />
          <Input
            type="text"
            label="Username"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            placeholder="Username login"
            variant="bordered"
          />
          <Input
            type="tel"
            label="No. HP"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: 081234567890"
            variant="bordered"
          />
          <Input
            type={showEditPassword ? 'text' : 'password'}
            label="Password Baru"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Biarkan kosong jika tidak ingin mengubah password"
            variant="bordered"
            endContent={
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowEditPassword(!showEditPassword)}
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showEditPassword ? 'visibility_off' : 'visibility'}
                </span>
              </Button>
            }
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, data: null })}
        onConfirm={onConfirmDelete}
        title="Hapus User"
        message={`Hapus user "${confirmState.data?.name}"? Aksi ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
