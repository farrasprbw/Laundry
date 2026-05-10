export function Reports() {
  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-12 px-container-padding-mobile md:px-container-padding-desktop max-w-[1440px] w-full flex-1 mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-on-surface">Financial Reports</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Overview of revenue, expenses, and profitability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm border border-outline-variant/20 hover:-translate-y-0.5 transform duration-200">
            <span className="material-symbols-outlined text-tertiary">calendar_month</span>
            This Month
            <span className="material-symbols-outlined text-tertiary text-sm">expand_more</span>
          </button>
        </div>
      </header>

      {/* Summary Cards (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Revenue Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">account_balance_wallet</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Revenue</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-surface mb-2">$12,450.00</div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm">
            <span className="text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 14%
            </span>
            <span className="text-on-surface-variant">vs last month</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-error">money_off</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">trending_down</span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Expenses</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-surface mb-2">$3,240.50</div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm">
            <span className="text-error bg-error-container/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 5%
            </span>
            <span className="text-on-surface-variant">vs last month</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-primary text-on-primary rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,88,190,0.15)] hover:shadow-[0_10px_30px_rgba(0,88,190,0.25)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-container rounded-full blur-2xl opacity-50"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-on-primary">savings</span>
            </div>
            <h3 className="text-label-md font-label-md text-primary-fixed-dim uppercase tracking-wider">Net Profit</h3>
          </div>
          <div className="text-display-lg font-display-lg text-on-primary mb-2 relative z-10">$9,209.50</div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm relative z-10">
            <span className="text-secondary-fixed bg-on-primary/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 18%
            </span>
            <span className="text-primary-fixed-dim">vs last month</span>
          </div>
        </div>
      </div>

      {/* Export & Settings Section (Glassmorphism Card) */}
      <div className="bg-surface/60 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 mb-10 shadow-sm relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span>
              Export Report
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">Generate detailed spreadsheets for accounting.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 ml-1">Report Type</label>
              <select className="bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-label-md font-label-md rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none transition-colors">
                <option>Daily Summary</option>
                <option>Weekly Overview</option>
                <option>Monthly Detail</option>
                <option>Tax Preparation</option>
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 ml-1">Date Range</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <span className="material-symbols-outlined text-tertiary text-sm">calendar_today</span>
                </div>
                <input className="bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-label-md font-label-md rounded-lg focus:ring-primary focus:border-primary block w-full ps-10 p-2.5 outline-none transition-colors" placeholder="Oct 1 - Oct 31, 2023" type="text" />
              </div>
            </div>
            <button className="w-full sm:w-auto bg-primary text-on-primary hover:bg-primary-container transition-colors px-6 py-2.5 rounded-lg text-label-md font-label-md flex items-center justify-center gap-2 shadow-sm font-semibold h-[42px]">
              <span className="material-symbols-outlined text-[20px]">table_view</span>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface/30">
          <h3 className="text-headline-md font-headline-md text-on-surface">Recent Transactions Preview</h3>
          <button className="text-primary text-label-md font-label-md hover:underline font-semibold">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider border-b border-outline-variant/20">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
              <tr className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-label-md font-label-md">Oct 24, 2023</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">Wash &amp; Fold - Order #8492</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant">Customer: Sarah J.</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md text-label-sm font-label-sm border border-outline-variant/20">Revenue</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-secondary">+$45.00</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-secondary-container/30 text-secondary px-2.5 py-1 rounded-full text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Completed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-label-md font-label-md">Oct 24, 2023</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">Detergent Restock (Vendor A)</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant">Inv #INV-2023-091</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md text-label-sm font-label-sm border border-outline-variant/20">Supplies</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-error">-$120.00</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-secondary-container/30 text-secondary px-2.5 py-1 rounded-full text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Paid
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-label-md font-label-md">Oct 23, 2023</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">Dry Cleaning - Order #8491</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant">Customer: Mike T.</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md text-label-sm font-label-sm border border-outline-variant/20">Revenue</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-secondary">+$85.50</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full text-label-sm font-label-sm border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[14px]">pending</span> Pending
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant text-label-md font-label-md">Oct 22, 2023</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">Machine #4 Maintenance</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant">Fixing drum issue</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md text-label-sm font-label-sm border border-outline-variant/20">Maintenance</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-error">-$250.00</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-secondary-container/30 text-secondary px-2.5 py-1 rounded-full text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface/30 text-center">
          <p className="text-label-sm font-label-sm text-on-surface-variant">Showing 4 of 1,204 transactions</p>
        </div>
      </div>
    </div>
  );
}
