import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { useUsers, useCreateUser, useUpdateUserRole, useDeleteUser } from '../hooks/use-users';
import type { UserRole } from '../types/api';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  worker: 'Worker',
};

const ROLE_STYLES: Record<UserRole, string> = {
  super_admin: 'bg-primary/15 text-primary border-primary/30',
  admin: 'bg-secondary/15 text-secondary border-secondary/30',
  worker: 'bg-surface-variant text-on-surface-variant border-outline-variant/30',
};

export function UserManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('worker');

  const { data: users = [], isLoading, error } = useUsers();
  const createMutation = useCreateUser();
  const updateRoleMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUser();

  const handleCreateUser = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('worker');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Gagal membuat user');
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
      setIsRoleModalOpen(false);
      setSelectedUserId(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Gagal mengubah role');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Hapus user "${name}"? Aksi ini tidak bisa dibatalkan.`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err?.response?.data?.error || 'Gagal menghapus user');
      }
    }
  };

  return (
    <div className="pt-24 px-6 md:px-10 pb-24 md:pb-10 max-w-[1440px] w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            User Management
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola user dan role matrix.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-on-primary rounded-xl py-3 px-5 flex items-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-md font-label-md text-label-md"
        >
          <span className="material-symbols-outlined">person_add</span>
          Tambah User
        </button>
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
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-error-container/30 border border-error/30 rounded-xl p-6 text-center">
          <p className="text-error font-label-md">Gagal memuat data users</p>
        </div>
      )}

      {/* User Table */}
      {!isLoading && !error && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Dibuat</th>
                  <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-body-md font-body-md text-on-surface">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-label-md">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-on-background">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant">{u.email}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm font-bold border ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant text-body-sm">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openRoleModal(u.id, u.role)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors"
                          title="Ubah Role"
                        >
                          <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                          title="Hapus User"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[32px] opacity-70">group</span>
                        <p className="text-body-md font-body-md font-medium">Belum ada user.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormName('');
          setFormEmail('');
          setFormPassword('');
          setFormRole('worker');
        }}
        title="Tambah User Baru"
        onSubmit={handleCreateUser}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Nama</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nama lengkap"
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Password</label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Role</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
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
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Pilih Role Baru</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
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
    </div>
  );
}
