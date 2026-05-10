export function Orders() {
  return (
    <div className="mt-16 p-container-padding-desktop flex-1 space-y-stack-lg">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary">receipt_long</span>
            Orders
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Manage and track all laundry processing phases.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 pr-10 text-label-md font-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer">
              <option>All Status</option>
              <option>Process</option>
              <option>Finished</option>
              <option>Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bento/Glassmorphism Data Table Container */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/20">
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {/* Row 1 */}
              <tr className="bg-surface hover:bg-surface-container-low transition-colors group">
                <td className="px-6 py-4 text-label-md font-label-md text-primary">#LS001</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-label-sm">BS</div>
                    <span className="text-body-md font-body-md text-on-surface">Budi S</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">Express</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface">5 kg</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface">850K</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">10/5</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
                    Process
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="bg-surface hover:bg-surface-container-low transition-colors group">
                <td className="px-6 py-4 text-label-md font-label-md text-primary">#LS002</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-label-sm">SW</div>
                    <span className="text-body-md font-body-md text-on-surface">Sari W</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">Standard</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface">3 kg</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface">120K</td>
                <td className="px-6 py-4 text-body-md font-body-md text-on-surface-variant">10/5</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                    Finished
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-on-surface-variant">Showing 1 to 2 of 2 entries</span>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
