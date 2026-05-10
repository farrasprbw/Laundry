export function Dashboard() {
  return (
    <main className="flex-1 pt-24 px-container-padding-desktop pb-container-padding-desktop max-w-[1440px] w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-gutter gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            Dashboard
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">10 Mei 2026</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Order Baru
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter mb-gutter">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Income</p>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-on-background">Rp 850K</h3>
            <p className="text-label-sm font-label-sm text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              +12% from yesterday
            </p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Expenses</p>
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[18px]">trending_down</span>
            </div>
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-on-background">Rp 120K</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">remove</span>
              Stable
            </p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-primary text-on-primary border border-primary/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,88,190,0.15)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-label-md font-label-md text-primary-fixed">Net Profit</p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-headline-md font-headline-md text-white">Rp 730K</h3>
            <p className="text-label-sm font-label-sm text-primary-fixed mt-1">Today's Earnings</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Total Orders</p>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface text-[18px]">local_laundry_service</span>
            </div>
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-on-background">12</h3>
            <p className="text-label-sm font-label-sm text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              4 Completed
            </p>
          </div>
        </div>

        {/* Stat Card 5 */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <p className="text-label-md font-label-md text-on-surface-variant">Pending Pickups</p>
            <div className="w-8 h-8 rounded-full bg-[#fef08a]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#854d0e] text-[18px]">directions_car</span>
            </div>
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-on-background">5</h3>
            <p className="text-label-sm font-label-sm text-[#854d0e] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Needs Action
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Financial Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-headline-md font-headline-md text-on-background">Financial Trend</h3>
              <p className="text-label-md font-label-md text-on-surface-variant">Income vs Expenses over the last 7 days</p>
            </div>
            <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>

          <div className="flex-1 min-h-[300px] relative w-full bg-surface-bright rounded-lg overflow-hidden border border-outline-variant/10">
            <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
              <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"></line>
              <line stroke="#e6eeff" strokeWidth="0.5" x1="0" x2="100" y1="75" y2="75"></line>
              <path d="M0,90 C20,85 40,88 60,82 C80,75 100,85 100,85 L100,100 L0,100 Z" fill="#ffdad6" opacity="0.4"></path>
              <path d="M0,90 C20,85 40,88 60,82 C80,75 100,85 100,85" fill="none" stroke="#ba1a1a" strokeWidth="1.5"></path>
              <path d="M0,70 C20,50 40,65 60,30 C80,10 100,20 100,20 L100,100 L0,100 Z" fill="url(#blue-gradient)" opacity="0.8"></path>
              <path d="M0,70 C20,50 40,65 60,30 C80,10 100,20 100,20" fill="none" stroke="#0058be" strokeWidth="2"></path>
              <defs>
                <linearGradient id="blue-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d8e2ff" stopOpacity="0.8"></stop>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1"></stop>
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute left-[60%] top-[20%] bg-surface-container-lowest border border-outline-variant/30 shadow-md rounded px-3 py-2 -translate-x-1/2 -translate-y-full">
              <p className="text-label-sm font-label-sm text-on-surface-variant">May 8</p>
              <p className="text-label-md font-label-md text-primary font-semibold">Rp 1.2M</p>
            </div>
            <div className="absolute left-[60%] top-[30%] w-3 h-3 bg-primary rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 shadow-sm"></div>
            <div className="absolute left-[60%] top-[30%] bottom-0 border-l border-dashed border-primary/50 -translate-x-1/2"></div>
          </div>
        </div>

        {/* Pending Pickups List */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-stack-md flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md text-on-background">Pending Pickups</h3>
            <span className="bg-[#fef08a]/30 text-[#854d0e] px-2 py-1 rounded text-label-sm font-label-sm">5 Active</span>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
            {[
              { in: "JD", name: "John Doe", ad: "Apt 4B, Maple Street", time: "14:00" },
              { in: "AS", name: "Alice Smith", ad: "House 12, Oak Avenue", time: "15:30" },
              { in: "MK", name: "Michael King", ad: "Suite 900, Office Park", time: "Overdue", err: true },
              { in: "EW", name: "Emma Watson", ad: "Block C, Tech Hub", time: "16:45" }
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary font-headline-md shrink-0">
                  {p.in}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md font-label-md text-on-background truncate">{p.name}</p>
                  <p className="text-body-md text-[13px] text-on-surface-variant truncate">{p.ad}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-label-sm font-label-sm ${p.err ? 'text-error' : 'text-on-background'}`}>{p.time}</p>
                  <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border border-outline-variant/50 rounded-lg text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
            View All Map Routes
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-gutter bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="text-headline-md font-headline-md text-on-background">Recent Orders</h3>
          <div className="flex gap-2">
            <button className="text-on-surface-variant hover:bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/50 text-label-md font-label-md transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20">Order ID</th>
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20">Customer</th>
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20">Service Type</th>
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20">Weight / Items</th>
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20">Status</th>
                <th className="py-3 px-6 text-label-sm font-label-sm text-on-surface-variant font-semibold border-b border-outline-variant/20 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-background">
              <tr className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer">
                <td className="py-4 px-6 text-label-md font-label-md text-primary">#ORD-0921</td>
                <td className="py-4 px-6">Sarah Jenkins</td>
                <td className="py-4 px-6">Wash & Fold</td>
                <td className="py-4 px-6 text-on-surface-variant">5.2 kg</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Washing</span>
                </td>
                <td className="py-4 px-6 text-right font-medium">Rp 45.000</td>
              </tr>
              <tr className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer">
                <td className="py-4 px-6 text-label-md font-label-md text-primary">#ORD-0920</td>
                <td className="py-4 px-6">David Chen</td>
                <td className="py-4 px-6">Dry Clean</td>
                <td className="py-4 px-6 text-on-surface-variant">3 Items</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">Ready</span>
                </td>
                <td className="py-4 px-6 text-right font-medium">Rp 120.000</td>
              </tr>
              <tr className="border-b border-outline-variant/10 hover:bg-surface-bright transition-colors cursor-pointer">
                <td className="py-4 px-6 text-label-md font-label-md text-primary">#ORD-0919</td>
                <td className="py-4 px-6">Amanda Roy</td>
                <td className="py-4 px-6">Ironing Only</td>
                <td className="py-4 px-6 text-on-surface-variant">12 Items</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">Pending</span>
                </td>
                <td className="py-4 px-6 text-right font-medium">Rp 60.000</td>
              </tr>
              <tr className="hover:bg-surface-bright transition-colors cursor-pointer">
                <td className="py-4 px-6 text-label-md font-label-md text-primary">#ORD-0918</td>
                <td className="py-4 px-6">Budi Santoso</td>
                <td className="py-4 px-6">Express Wash</td>
                <td className="py-4 px-6 text-on-surface-variant">4.0 kg</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Drying</span>
                </td>
                <td className="py-4 px-6 text-right font-medium">Rp 80.000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest text-center">
          <button className="text-primary text-label-md font-label-md hover:underline font-medium">View All Orders</button>
        </div>
      </div>
    </main>
  );
}
