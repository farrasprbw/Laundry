import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSession, useLogout } from '../../hooks/use-auth';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { AddOrderModal } from '../ui/AddOrderModal';

export function WorkerLayout() {
  const { data: session } = useSession();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex flex-col items-center justify-center text-primary active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1"
      : "flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1";

  return (
    <div className="w-full max-w-[100vw] min-h-screen flex flex-col bg-surface relative overflow-x-hidden">
      {/* Top App Bar Simple */}
      <header className="h-16 px-4 fixed top-0 left-0 w-full bg-surface/80 backdrop-blur-lg border-b border-outline-variant/30 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px]">local_laundry_service</span>
          <h1 className="text-title-lg font-bold text-on-surface">Laundry Worker</h1>
        </div>
        
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              className="rounded-full"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container text-primary font-bold flex items-center justify-center">
                {(session?.user?.name || "W").charAt(0).toUpperCase()}
              </div>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2 text-on-surface">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold text-primary">{session?.user?.name}</p>
            </DropdownItem>
            <DropdownItem 
              key="logout" 
              color="danger" 
              startContent={<span className="material-symbols-outlined text-[18px]">logout</span>}
              onPress={() => logout()}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full pb-safe-offset-20">
        <Outlet />
      </div>

      {/* Bottom Nav specifically for Worker */}
      <nav className="flex justify-around items-center h-16 pb-safe fixed bottom-0 left-0 w-full z-50 rounded-t-xl bg-surface/80 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2">
        <NavLink to="/worker/dashboard" className={getNavLinkClass}>
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined mb-1 ${isActive ? 'fill-icon' : ''}`}>list_alt</span>
              <span className={`text-label-sm font-label-sm ${isActive ? 'font-bold' : ''}`}>Tugas</span>
            </>
          )}
        </NavLink>

        <div className="flex-shrink-0 mx-2">
          <Button
            isIconOnly
            radius="full"
            color="primary"
            onPress={() => navigate('/worker/scanner')}
            className="-mt-8 shadow-md border-4 border-background w-14 h-14 min-w-14 z-50 text-white"
          >
            <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
          </Button>
        </div>

        <button 
          onClick={() => setIsOrderModalOpen(true)} 
          className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-90 transition-transform flex-1 h-full rounded-xl mx-1"
        >
          <span className="material-symbols-outlined mb-1">add_circle</span>
          <span className="text-label-sm font-label-sm">Tambah</span>
        </button>
      </nav>
      <AddOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </div>
  );
}
