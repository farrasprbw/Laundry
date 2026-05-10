import { useState } from 'react';
import { Modal } from '../components/ui/Modal';

export function PaymentMethods() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');

  // Dummy data
  const [methods, setMethods] = useState([
    { id: 1, name: 'QRIS', active: true },
    { id: 2, name: 'Transfer', active: true },
    { id: 3, name: 'Tunai', active: true },
    { id: 4, name: 'Belum Bayar', active: true },
  ]);

  const handleAddMethod = () => {
    if (newMethodName.trim()) {
      setMethods([
        ...methods,
        {
          id: Date.now(),
          name: newMethodName,
          active: true
        }
      ]);
      setNewMethodName('');
      setIsModalOpen(false);
    }
  };

  const toggleMethodStatus = (id: number) => {
    setMethods(methods.map(m =>
      m.id === id ? { ...m, active: !m.active } : m
    ));
  };

  return (
    <div className="pt-24 px-6 md:px-10 pb-24 md:pb-10 max-w-[1440px] w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
            Payment Methods
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola metode pembayaran yang tersedia.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary rounded-xl py-3 px-5 flex items-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-md font-label-md text-label-md"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Metode
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama Metode</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-body-md font-body-md text-on-surface">
              {methods.map((method) => (
                <tr key={method.id} className="hover:bg-surface-container-lowest transition-colors group">
                  <td className="px-6 py-5 font-medium text-on-background">
                    {method.name}
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => toggleMethodStatus(method.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm font-bold border transition-colors ${method.active
                        ? 'bg-primary-container/30 text-primary border-primary/30 hover:bg-primary-container'
                        : 'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30 hover:bg-surface-variant'
                        }`}
                    >
                      {method.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {methods.length === 0 && (
                <tr className="hover:bg-surface-container-lowest transition-colors cursor-pointer group border-t-2 border-dashed border-outline-variant/30">
                  <td className="px-6 py-8 text-center" colSpan={3}>
                    <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px] opacity-70">account_balance_wallet</span>
                      <p className="text-body-md font-body-md font-medium">Belum ada metode pembayaran.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewMethodName('');
        }}
        title="Tambah Metode Pembayaran"
        onSubmit={handleAddMethod}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Metode Pembayaran</label>
            <input
              type="text"
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Contoh: E-Wallet DANA"
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
