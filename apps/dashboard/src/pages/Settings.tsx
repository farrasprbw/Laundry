import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "../hooks/use-settings";
import {
  Button,
  Input,
  Textarea,
  Spinner,
} from "@nextui-org/react";
import { useAlert } from "../contexts/AlertContext";

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState<Record<string, string>>({
    store_name: "",
    store_address: "",
    store_address_full: "",
    store_phone: "",
    store_logo_url: "",
    bank_account: "",
    store_maps_url: "",
    store_disclaimer: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || "",
        store_address: settings.store_address || "",
        store_address_full: settings.store_address_full || "",
        store_phone: settings.store_phone || "",
        store_logo_url: settings.store_logo_url || "",
        bank_account: settings.bank_account || "",
        store_maps_url: settings.store_maps_url || "",
        store_disclaimer: settings.store_disclaimer || "",
      });
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      showAlert("Pengaturan berhasil disimpan!", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showAlert("Gagal menyimpan pengaturan.", "danger");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center pt-24 pb-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop">
        <Spinner label="Memuat pengaturan..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 pt-24 pb-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop w-full max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
          <span className="material-symbols-outlined text-[32px] text-primary">settings</span> Pengaturan Toko
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Kelola informasi toko yang akan ditampilkan di struk, invoice, dan WhatsApp.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 p-6 flex flex-col gap-6">
        
        <div className="flex flex-col gap-4">
          <h3 className="text-title-md font-semibold text-primary border-b border-outline-variant/30 pb-2">
            Informasi Umum
          </h3>
          
          <Input
            label="Nama Toko"
            placeholder="Masukkan nama toko"
            value={formData.store_name}
            onChange={(e) => handleChange("store_name", e.target.value)}
            variant="bordered"
            description="Ditampilkan sebagai header di struk dan invoice."
          />
          
          <Input
            label="Nomor WhatsApp Toko"
            placeholder="Contoh: 0812-3456-7890"
            value={formData.store_phone}
            onChange={(e) => handleChange("store_phone", e.target.value)}
            variant="bordered"
            description="Nomor kontak toko untuk pelanggan."
          />

          <Input
            label="Alamat Singkat (Untuk Struk Thermal)"
            placeholder="Apt. Rajawali, Jakarta Pusat"
            value={formData.store_address}
            onChange={(e) => handleChange("store_address", e.target.value)}
            variant="bordered"
            description="Alamat versi pendek agar muat di kertas struk thermal."
          />

          <Textarea
            label="Alamat Lengkap"
            placeholder="Masukkan alamat lengkap toko"
            value={formData.store_address_full}
            onChange={(e) => handleChange("store_address_full", e.target.value)}
            variant="bordered"
            description="Ditampilkan di halaman invoice publik dan dikirim via WhatsApp."
          />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-title-md font-semibold text-primary border-b border-outline-variant/30 pb-2">
            Media & Link
          </h3>
          
          <div className="flex gap-4 items-start">
            <Input
              label="URL Logo Toko"
              placeholder="https://..."
              value={formData.store_logo_url}
              onChange={(e) => handleChange("store_logo_url", e.target.value)}
              variant="bordered"
              className="flex-1"
              description="Logo yang akan ditampilkan di invoice online."
            />
            {formData.store_logo_url && (
              <div className="w-16 h-16 shrink-0 rounded-lg border border-outline overflow-hidden bg-white">
                <img src={formData.store_logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          <Input
            label="URL Google Maps"
            placeholder="https://maps.app.goo.gl/..."
            value={formData.store_maps_url}
            onChange={(e) => handleChange("store_maps_url", e.target.value)}
            variant="bordered"
            description="Digunakan untuk generate QR Code di struk."
          />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-title-md font-semibold text-primary border-b border-outline-variant/30 pb-2">
            Pembayaran & Ketentuan
          </h3>
          
          <Textarea
            label="Informasi Rekening Bank"
            placeholder="BCA 123456789 a/n Nama Anda"
            value={formData.bank_account}
            onChange={(e) => handleChange("bank_account", e.target.value)}
            variant="bordered"
            description="Informasi ini akan dikirim via WhatsApp untuk order yang belum dibayar."
          />

          <Textarea
            label="Syarat & Ketentuan (Disclaimer)"
            placeholder="Syarat 1|Syarat 2"
            value={formData.store_disclaimer}
            onChange={(e) => handleChange("store_disclaimer", e.target.value)}
            variant="bordered"
            description="Pisahkan setiap poin dengan tanda garis vertikal (|). Akan dicetak di struk."
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={updateSettings.isPending}
            className="px-8 font-semibold text-white"
          >
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}
