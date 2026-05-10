import { NavLink } from 'react-router-dom';

export function BottomNavBar() {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex flex-col items-center justify-center text-primary hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1"
      : "flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1";

  return (
    <nav className="md:hidden flex justify-around items-center h-16 pb-safe fixed bottom-0 left-0 w-full z-50 rounded-t-xl bg-surface/80 backdrop-blur-lg border-t border-outline-variant/30 shadow-lg">
      <NavLink to="/dashboard" className={getNavLinkClass}>
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>home</span>
            <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>Home</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/orders" className={getNavLinkClass}>
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>list_alt</span>
            <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>Orders</span>
          </>
        )}
      </NavLink>

      {/* Floating Action Button inside Navbar */}
      <button className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1">
        <div className="bg-primary text-on-primary rounded-full p-2 -mt-6 shadow-md border-4 border-background">
          <span className="material-symbols-outlined">add</span>
        </div>
      </button>

      <NavLink to="/expenses" className={getNavLinkClass}>
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>payments</span>
            <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>Money</span>
          </>
        )}
      </NavLink>

      <NavLink to="/reports" className={getNavLinkClass}>
        {({ isActive }) => (
          <>
            <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>bar_chart</span>
            <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>Stats</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
