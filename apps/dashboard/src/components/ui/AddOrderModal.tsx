import { Modal } from './Modal';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Buat Order Baru"
      onSubmit={() => {
        // Handle submit logic here
        onClose();
      }}
      submitText="Buat Order"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Pilih Pelanggan</label>
          <select className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
            <option value="" disabled selected>Pilih pelanggan...</option>
            <option value="1">Budi Santoso</option>
            <option value="2">Sari Wulan</option>
            <option value="new">+ Tambah Pelanggan Baru</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Layanan</label>
          <select className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
            <option value="" disabled selected>Pilih layanan...</option>
            <option value="1">Cuci Standard (Rp 7.000/kg)</option>
            <option value="2">Cuci Kilat (Rp 12.000/kg)</option>
            <option value="3">Bedding (Rp 15.000/pc)</option>
            <option value="4">Setrika Saja (Rp 5.000/kg)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Berat / Jumlah</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="0" 
                step="0.1"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Total Harga</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">Rp</span>
              <input 
                type="number" 
                placeholder="0" 
                readOnly
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-body-md text-on-surface-variant focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-label-md font-label-md text-on-surface">Status Pembayaran</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="paymentStatus" className="w-4 h-4 text-primary focus:ring-primary accent-primary" defaultChecked />
              <span className="text-body-md text-on-surface">Belum Lunas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="paymentStatus" className="w-4 h-4 text-primary focus:ring-primary accent-primary" />
              <span className="text-body-md text-on-surface">Lunas</span>
            </label>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-label-md text-on-surface">Catatan (Opsional)</label>
          <textarea 
            placeholder="Tambahkan catatan khusus untuk order ini..." 
            rows={2}
            className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
          ></textarea>
        </div>
      </div>
    </Modal>
  );
}
