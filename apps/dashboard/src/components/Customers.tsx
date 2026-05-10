export function Customers() {
  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mt-16 w-full flex flex-col gap-8">
      {/* Page Header: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-3">
            <span className="text-primary text-4xl">👥</span> Pelanggan
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Kelola data pelanggan dan riwayat transaksi.</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 text-label-md font-label-md whitespace-nowrap self-start sm:self-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Pelanggan
        </button>
      </div>

      {/* Filters & Search Bar Section */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Specific Customer Search */}
        <div className="w-full sm:w-96 flex items-center bg-surface-bright border border-outline-variant/50 rounded-lg px-4 py-2.5 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
          <input className="bg-transparent border-none outline-none text-body-md font-body-md w-full placeholder-outline text-on-surface focus:ring-0 p-0" placeholder="Cari nama atau nomor telepon..." type="text" />
        </div>
        {/* Auxiliary Filters */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 rounded-lg border border-outline-variant/50 text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="px-4 py-2 rounded-lg border border-outline-variant/50 text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Terbaru
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Nomor Telepon</th>
                <th className="px-6 py-4 font-semibold hidden sm:table-cell">Alamat</th>
                <th className="px-6 py-4 font-semibold text-center">Total Order</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-body-md font-body-md text-on-surface">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-lowest transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-headline-md font-bold text-lg shrink-0">BS</div>
                    <div>
                      <p className="font-semibold text-on-background group-hover:text-primary transition-colors">Budi Santoso</p>
                      <p className="text-label-sm font-label-sm text-on-surface-variant sm:hidden mt-0.5">0812-3456-789</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-on-surface-variant hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                    0812-3456-789
                  </div>
                </td>
                <td className="px-6 py-5 text-on-surface-variant hidden sm:table-cell">
                  <div className="flex items-center gap-2 max-w-[200px] truncate" title="Jl. Mawar No. 15, Jakarta">
                    <span className="material-symbols-outlined text-[16px] text-outline shrink-0">location_on</span>
                    <span className="truncate">Jl. Mawar No. 15</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-variant text-on-surface text-label-sm font-label-sm font-bold border border-outline-variant/30">
                    12 Orders
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 md:hidden">
                    <button className="p-2 text-outline" title="Options">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-lowest transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-headline-md font-bold text-lg shrink-0">SW</div>
                    <div>
                      <p className="font-semibold text-on-background group-hover:text-primary transition-colors">Sari Wulan</p>
                      <p className="text-label-sm font-label-sm text-on-surface-variant sm:hidden mt-0.5">0856-1234-567</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-on-surface-variant hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                    0856-1234-567
                  </div>
                </td>
                <td className="px-6 py-5 text-outline hidden sm:table-cell">
                  <span className="italic">- Belum ada alamat -</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm font-bold border border-outline-variant/20">
                    8 Orders
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 md:hidden">
                    <button className="p-2 text-outline" title="Options">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Empty State */}
              <tr className="hover:bg-surface-container-lowest transition-colors cursor-pointer group border-t-2 border-dashed border-outline-variant/30">
                <td className="px-6 py-8 text-center" colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[32px] opacity-70">person_add</span>
                    <p className="text-body-md font-body-md font-medium">Belum menemukan pelanggan?</p>
                    <span className="text-label-sm font-label-sm text-primary">Tambah pelanggan baru sekarang</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Table Pagination Footer */}
        <div className="bg-surface-container-low/30 border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div>Menampilkan 2 dari 2 pelanggan</div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-outline-variant/50 text-outline hover:bg-surface hover:text-on-surface disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="p-1.5 rounded-lg border border-outline-variant/50 text-outline hover:bg-surface hover:text-on-surface disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
