import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { Button } from '@nextui-org/react';

interface TopAppBarProps {
  onMenuClick?: () => void;
}

export function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate('/login');
        },
        onError: () => {
          setIsLoggingOut(false);
        }
      },
    });
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center h-16 px-6 ml-auto">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            isIconOnly
            variant="light"
            onPress={onMenuClick}
            className="md:hidden text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </Button>
        )}
        <span className="text-headline-md font-headline-md text-primary md:hidden">Laundry</span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          onPress={handleLogout}
          isLoading={isLoggingOut}
          variant="light"
          color="danger"
          startContent={!isLoggingOut && <span className="material-symbols-outlined text-[20px]">logout</span>}
          className="font-bold text-label-md"
        >
          <span className="hidden md:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </Button>
      </div>
    </header>
  );
}
