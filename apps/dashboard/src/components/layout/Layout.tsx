import { Outlet } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';

export function Layout() {
  return (
    <div className="w-full flex">
      <SideNavBar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative pb-16 md:pb-0">
        <TopAppBar />
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
