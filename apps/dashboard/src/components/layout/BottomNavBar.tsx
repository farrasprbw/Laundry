import { NavLink } from 'react-router-dom';
import { useSession } from '../../hooks/use-auth';
import type { UserRole } from '../../types/api';

interface BottomNavItem {
  to: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Home', roles: ['super_admin', 'admin', 'worker'] },
  { to: '/orders', icon: 'list_alt', label: 'Orders', roles: ['super_admin', 'admin', 'worker'] },
  { to: '/expenses', icon: 'payments', label: 'Money', roles: ['super_admin', 'admin'] },
  { to: '/reports', icon: 'bar_chart', label: 'Stats', roles: ['super_admin', 'admin'] },
];

export function BottomNavBar() {
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.role as UserRole) || 'worker';

  const filteredItems = BOTTOM_NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex flex-col items-center justify-center text-primary hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1"
      : "flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1";

  return (
    <nav className="md:hidden flex justify-around items-center h-16 pb-safe fixed bottom-0 left-0 w-full z-50 rounded-t-xl bg-surface/80 backdrop-blur-lg border-t border-outline-variant/30 shadow-lg">
      {filteredItems.map((item, index) => {
        // Insert FAB button in the middle
        if (index === Math.floor(filteredItems.length / 2)) {
          return (
            <div key="fab-group" className="contents">
              <button className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1">
                <div className="bg-primary text-on-primary rounded-full p-2 -mt-6 shadow-md border-4 border-background">
                  <span className="material-symbols-outlined">add</span>
                </div>
              </button>
              <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
                    <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            </div>
          );
        }
        return (
          <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
                <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
