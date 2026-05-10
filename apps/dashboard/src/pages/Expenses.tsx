import { useState } from 'react';
import { Modal } from '../components/ui/Modal';

export function Expenses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-10 px-container-padding-mobile md:px-container-padding-desktop max-w-[1440px] w-full flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg md:text-display-lg md:font-display-lg text-on-surface">Expenses</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Track and manage facility operational costs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container transition-all active:scale-[0.98] py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md h-[48px] md:h-[56px]"
        >
          <span className="material-symbols-outlined fill-icon">add</span>
          <span className="font-label-md text-label-md font-semibold">Add Expense</span>
        </button>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-surface border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline">search</span>
          </div>
          <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface transition-colors placeholder:text-outline/70" placeholder="Search expenses..." type="text" />
        </div>
        {/* Filters */}
        <div className="flex w-full lg:w-auto gap-3">
          <div className="relative flex-1 lg:w-48">
            <select className="w-full appearance-none bg-surface-container-low border-none py-3 pl-4 pr-10 rounded-xl text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary cursor-pointer">
              <option value="oct-2023">October 2023</option>
              <option value="sep-2023">September 2023</option>
              <option value="aug-2023">August 2023</option>
            </select>
          </div>
          <button className="bg-surface-container-high hover:bg-surface-variant text-on-surface-variant p-3 rounded-xl transition-colors flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 text-label-md font-label-md text-on-surface-variant">
                <th className="py-4 px-6 font-medium tracking-wider">Date</th>
                <th className="py-4 px-6 font-medium tracking-wider">Category</th>
                <th className="py-4 px-6 font-medium tracking-wider hidden sm:table-cell">Description</th>
                <th className="py-4 px-6 font-medium tracking-wider text-right">Amount</th>
                <th className="py-4 px-6 font-medium tracking-wider w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-surface divide-y divide-outline-variant/10">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium">Oct 24, 2023</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">10:45 AM</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed-dim/30 text-on-primary-fixed-variant text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[16px]">water_drop</span>
                    Detergent
                  </span>
                </td>
                <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                  Bulk order High-Efficiency Liquid (50 gal)
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium">
                  $450.00
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <button className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium">Oct 22, 2023</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">09:00 AM</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-on-surface text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Electricity
                  </span>
                </td>
                <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                  Monthly utility bill (Facility A)
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium">
                  $1,280.50
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <button className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium">Oct 18, 2023</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">02:15 PM</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/50 text-on-error-container text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    Maintenance
                  </span>
                </td>
                <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                  Repair on Washer #04 (Drum issue)
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium">
                  $320.00
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <button className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium">Oct 15, 2023</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">11:30 AM</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[16px]">water_damage</span>
                    Water
                  </span>
                </td>
                <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                  Bi-monthly water usage bill
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium">
                  $850.75
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <button className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium">Oct 01, 2023</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">08:00 AM</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed-variant text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[16px]">store</span>
                    Rent
                  </span>
                </td>
                <td className="py-4 px-6 hidden sm:table-cell text-on-surface-variant max-w-xs truncate">
                  Commercial lease payment (Oct)
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium">
                  $3,500.00
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <button className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-on-surface-variant">Showing 1 to 5 of 24 entries</span>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Expense"
        onSubmit={() => {
          // Handle submit logic here
          setIsModalOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Date</label>
            <input 
              type="date" 
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Category</label>
            <select className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
              <option value="detergent">Detergent & Supplies</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="maintenance">Maintenance</option>
              <option value="rent">Rent</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
              <input 
                type="number" 
                placeholder="0.00" 
                step="0.01"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-label-md text-on-surface">Description</label>
            <textarea 
              placeholder="Enter expense details" 
              rows={3}
              className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
            ></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
}
