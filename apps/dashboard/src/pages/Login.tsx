import { useState } from 'react';
import { useLogin } from '../hooks/use-auth';
import { Button, Input } from '@nextui-org/react';

export function Login() {
  const { login } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      await login(username, password);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-br from-surface via-surface-container-lowest to-surface-container-low text-on-surface font-body-md flex items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-primary-fixed/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-secondary-fixed/20 blur-[120px]"></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[480px] px-container-padding-mobile md:px-0">
        {/* Glassmorphism Card */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-3xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-outline-variant/30 p-8 md:p-12 flex flex-col items-center">

          {/* Brand & Header */}
          <div className="text-center mb-stack-lg flex flex-col items-center w-full">
            {/* Logo Substitute (Icon + Text) */}
            <div className="flex items-center justify-center gap-2 mb-stack-sm text-primary">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Laundry</h1>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mt-stack-md">Welcome Back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">Login to manage your laundry</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-stack-md bg-error/10 border border-error/30 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">error</span>
              <p className="text-body-md text-error">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="w-full flex flex-col gap-6" onSubmit={handleLogin}>

            {/* Username Field */}
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              label="Username"
              isRequired
              isDisabled={loading}
              variant="bordered"
              startContent={<span className="material-symbols-outlined text-outline text-[20px] mr-1">person</span>}
            />

            {/* Password Field */}
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              isRequired
              isDisabled={loading}
              variant="bordered"
              startContent={<span className="material-symbols-outlined text-outline text-[20px] mr-1">lock</span>}
              endContent={
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setShowPassword(!showPassword)}
                  className="text-outline hover:text-on-surface"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </Button>
              }
            />

            {/* Primary Action Button */}
            <Button
              type="submit"
              color="primary"
              className="w-full py-7 shadow-md font-semibold text-label-md rounded-lg mt-2 text-white"
              isLoading={loading}
              endContent={!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
