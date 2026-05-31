import { db } from "../db/index.js";
import { storeSettings } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  store_name: "MAXPRESS LAUNDROMAT",
  store_address: "Apt. Rajawali, Jakarta Pusat",
  store_address_full: "Apartment Amethys Jalan Rajawali Selatan Gunung Sahari Utara Jakarta Pusat",
  store_phone: "0812-9678-8330",
  store_logo_url: "https://lh3.googleusercontent.com/p/AF1QipN32b0TofR28tK1Nq-bUeD_v4fVjA_Q2yJdXX1I=s1360-w1360-h1020",
  bank_account: "BCA 6565125439 a/n NUR PUJI LESTARI",
  store_maps_url: "https://maps.app.goo.gl/6EtkVKWEwRKrLwSK6",
  store_disclaimer: "Pengambilan barang harus disertai invoice.|Klaim berlaku 24 jam setelah barang diambil.|Kain luntur, berkerut karna sifat kain diluar tanggung jawab kami.|Cucian yang tidak diambil dalam waktu 1 bulan bila rusak / hilang bukan tanggung jawab kami.",
};

export const settingsService = {
  /** Get all settings as a flat key-value object */
  async getAll(): Promise<Record<string, string>> {
    const records = await db.select().from(storeSettings);
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const record of records) {
      settingsMap[record.key] = record.value;
    }

    return settingsMap;
  },

  /** Update multiple settings at once */
  async bulkUpsert(settings: Record<string, string>): Promise<void> {
    const keys = Object.keys(settings);
    if (keys.length === 0) return;

    // Use transaction if needed, but sequential is fine for a few settings
    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(storeSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: storeSettings.key,
          set: { value, updatedAt: new Date() },
        });
    }
  },
};
