export function TopAppBar() {
  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center h-16 px-6 ml-auto">
      <div className="flex items-center gap-4">
        <span className="text-headline-md font-headline-md text-primary md:hidden">LaundroFlow</span>
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-label-md font-label-md text-on-surface p-0 w-48 placeholder-on-surface-variant/50" placeholder="Search..." type="text"/>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors w-10 h-10 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors w-10 h-10 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95 transition-transform ml-2">
          New Order
        </button>
      </div>
    </header>
  );
}
