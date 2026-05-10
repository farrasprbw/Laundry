export function Categories() {
  return (
    <div className="pt-24 px-6 md:px-10 pb-24 md:pb-10 max-w-[1440px] mx-auto w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl fill-icon">sell</span>
            Kategori Laundry
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola jenis layanan dan harga dasar per kilogram.</p>
        </div>
        <button className="bg-primary text-on-primary rounded-xl py-3 px-5 flex items-center gap-2 hover:bg-surface-tint active:scale-95 transition-all shadow-md font-label-md text-label-md">
          <span className="material-symbols-outlined">add</span>
          Tambah Kategori
        </button>
      </div>

      {/* Bento Grid Canvas for Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Category Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">styler</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-headline-md font-headline-md text-on-background mb-1">Cuci Standard</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Pakaian Harian</p>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-body-md font-body-md text-on-surface-variant">Harga</span>
                <span className="text-body-md font-body-md font-semibold text-on-background">Rp 7.000<span className="text-label-sm text-on-surface-variant font-normal">/kg</span></span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="text-label-md font-label-md">24 jam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-2xl">dry_cleaning</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-headline-md font-headline-md text-on-background mb-1">Cuci Kilat</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Layanan Cepat</p>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-body-md font-body-md text-on-surface-variant">Harga</span>
                <span className="text-body-md font-body-md font-semibold text-on-background">Rp 12.000<span className="text-label-sm text-on-surface-variant font-normal">/kg</span></span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="text-label-md font-label-md">6 jam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined text-2xl">bed</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-headline-md font-headline-md text-on-background mb-1">Bedding</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Sprei &amp; Selimut</p>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-body-md font-body-md text-on-surface-variant">Harga</span>
                <span className="text-body-md font-body-md font-semibold text-on-background">Rp 15.000<span className="text-label-sm text-on-surface-variant font-normal">/pc</span></span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="text-label-md font-label-md">48 jam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">iron</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-headline-md font-headline-md text-on-background mb-1">Setrika Saja</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Tanpa Cuci</p>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-body-md font-body-md text-on-surface-variant">Harga</span>
                <span className="text-body-md font-body-md font-semibold text-on-background">Rp 5.000<span className="text-label-sm text-on-surface-variant font-normal">/kg</span></span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="text-label-md font-label-md">24 jam</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
