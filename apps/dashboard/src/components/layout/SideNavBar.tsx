import { NavLink } from 'react-router-dom';
import { useSession } from '../../hooks/use-auth';
import type { UserRole } from '../../types/api';
import { Button } from '@nextui-org/react';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: UserRole[]; // which roles can see this menu
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['super_admin', 'admin'] },
  { to: '/orders', icon: 'receipt_long', label: 'Orders', roles: ['super_admin', 'admin', 'worker'] },
  { to: '/customers', icon: 'group', label: 'Customers', roles: ['super_admin', 'admin'] },
  { to: '/categories', icon: 'category', label: 'Categories', roles: ['super_admin', 'admin'] },
  { to: '/expenses', icon: 'payments', label: 'Expenses', roles: ['super_admin', 'admin'] },
  { to: '/payment-methods', icon: 'account_balance_wallet', label: 'Payment Methods', roles: ['super_admin', 'admin'] },
  { to: '/reports', icon: 'analytics', label: 'Reports', roles: ['super_admin', 'admin'] },
  { to: '/user-management', icon: 'admin_panel_settings', label: 'User Management', roles: ['super_admin'] },
];

interface SideNavBarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SideNavBar({ isOpen = false, onClose }: SideNavBarProps) {
  const { data: session } = useSession();

  const userRole = ((session?.user as any)?.role as UserRole) || 'worker';

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary-container text-on-primary-container rounded-xl mx-2 my-1 flex items-center gap-3 px-4 py-3 text-label-md font-label-md cursor-pointer font-bold shadow-sm"
      : "text-on-surface-variant hover:bg-surface-container-high rounded-xl mx-2 my-1 flex items-center gap-3 px-4 py-3 text-label-md font-label-md hover:translate-x-1 transition-transform cursor-pointer group";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-surface-container-low border-r border-outline-variant/20 shadow-md fixed left-0 top-0 h-screen w-64 flex flex-col pt-6 pb-24 md:pb-6 z-[70] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:z-40`}
      >
        <div className="px-6 mb-8 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-headline-md font-headline-md text-primary tracking-tight">Laundry</h1>
            <p className="text-label-md font-label-md text-on-surface-variant">Manage Facility</p>
          </div>
          {onClose && (
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              className="md:hidden text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </Button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={getNavLinkClass}
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : 'group-hover:text-primary transition-colors'}`}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
