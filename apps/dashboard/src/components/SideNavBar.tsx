import { NavLink } from 'react-router-dom';

export function SideNavBar() {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary-container text-on-primary-container rounded-xl mx-2 my-1 flex items-center gap-3 px-4 py-3 text-label-md font-label-md cursor-pointer font-bold shadow-sm"
      : "text-on-surface-variant hover:bg-surface-container-high rounded-xl mx-2 my-1 flex items-center gap-3 px-4 py-3 text-label-md font-label-md hover:translate-x-1 transition-transform cursor-pointer group";

  return (
    <aside className="bg-surface-container-low border-r border-outline-variant/20 shadow-md fixed left-0 top-0 h-screen w-64 flex flex-col py-6 z-50 hidden md:flex">
      <div className="px-6 mb-8 flex flex-col gap-1">
        <h1 className="text-headline-md font-headline-md text-primary tracking-tight">LaundroFlow Admin</h1>
        <p className="text-label-md font-label-md text-on-surface-variant">Manage Facility</p>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        <NavLink to="/dashboard" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>dashboard</span>
              Dashboard
            </>
          )}
        </NavLink>
        <NavLink to="/orders" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>receipt_long</span>
              Orders
            </>
          )}
        </NavLink>
        <NavLink to="/customers" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>group</span>
              Customers
            </>
          )}
        </NavLink>
        <NavLink to="/categories" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>category</span>
              Categories
            </>
          )}
        </NavLink>
        <NavLink to="/expenses" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>payments</span>
              Expenses
            </>
          )}
        </NavLink>
        <NavLink to="/reports" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>analytics</span>
              Reports
            </>
          )}
        </NavLink>
      </nav>

      {/* CTA Action */}
      <div className="px-6 mb-6 mt-4">
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl hover:shadow-lg hover:bg-primary/90 transition-all active:scale-95 text-label-md font-label-md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Order
        </button>
      </div>

      <div className="flex flex-col gap-1 px-2 pt-4 border-t border-outline-variant/20">
        <NavLink to="/settings" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-tertiary transition-colors'}`}>settings</span>
              Settings
            </>
          )}
        </NavLink>
        <NavLink to="/support" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-tertiary transition-colors'}`}>help</span>
              Support
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
