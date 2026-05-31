import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSession } from '../../hooks/use-auth';
import { AddOrderModal } from '../ui/AddOrderModal';
import type { UserRole } from '../../types/api';
import { Button } from '@nextui-org/react';

interface BottomNavItem {
  to: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Home', roles: ['super_admin', 'admin'] },
  { to: '/orders', icon: 'list_alt', label: 'Orders', roles: ['super_admin', 'admin'] },
  { to: '/expenses', icon: 'payments', label: 'Money', roles: ['super_admin', 'admin'] },
  { to: '/reports', icon: 'bar_chart', label: 'Stats', roles: ['super_admin', 'admin'] },
];

export function BottomNavBar() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = ((session?.user as { role?: string })?.role as UserRole) || 'worker';

  const filteredItems = BOTTOM_NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex flex-col items-center justify-center text-primary hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1"
      : "flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1";

  const renderItem = (item: BottomNavItem) => (
    <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
      {({ isActive }) => (
        <>
          <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
          <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
        </>
      )}
    </NavLink>
  );

  const halfIndex = Math.ceil(filteredItems.length / 2);

  return (
    <>
      <nav className="md:hidden flex justify-around items-center h-16 pb-safe fixed bottom-0 left-0 w-full z-50 rounded-t-xl bg-surface/80 backdrop-blur-lg border-t border-outline-variant/30 shadow-lg px-2">
        
        {/* Left items */}
        {filteredItems.slice(0, halfIndex).map(renderItem)}
        
        {/* FAB in the middle */}
        <div className="flex-shrink-0 mx-2">
          <Button
            isIconOnly
            radius="full"
            color="primary"
            onPress={() => setIsOrderModalOpen(true)}
            className="-mt-8 shadow-md border-4 border-background w-14 h-14 min-w-14 z-50 text-white"
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </Button>
        </div>

        {/* Right items */}
        {filteredItems.slice(halfIndex).map(renderItem)}

        {/* Dummy spacer to balance flex if items count is odd */}
        {filteredItems.length % 2 !== 0 && <div className="flex-1" />}
      </nav>
      <AddOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </>
  );
}
