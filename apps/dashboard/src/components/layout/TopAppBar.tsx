import { useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';

export function TopAppBar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate('/login');
        },
      },
    });
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center h-16 px-6 ml-auto">
      <div className="flex items-center gap-4">
        <span className="text-headline-md font-headline-md text-primary md:hidden">Laundry</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center text-error hover:bg-error/10 transition-colors px-4 py-2 rounded-lg active:scale-95 gap-2 text-label-md font-label-md font-bold"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
