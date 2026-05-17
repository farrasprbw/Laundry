import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { SideNavBar } from './SideNavBar';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-full max-w-[100vw] flex overflow-x-hidden">
      <SideNavBar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative pb-16 md:pb-0 overflow-x-hidden">
        <TopAppBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
