import { useState } from 'react';
import { useLogin } from '../hooks/use-auth';

export function Login() {
  const { login } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-surface via-surface-container-lowest to-surface-container-low text-on-surface font-body-md min-h-screen flex items-center justify-center relative overflow-hidden" style={{ minHeight: 'max(884px, 100dvh)' }}>
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
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Laundra</h1>
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
          <form className="w-full flex flex-col gap-stack-md" onSubmit={handleLogin}>
            
            {/* Email Field */}
            <div className="flex flex-col gap-stack-sm">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input 
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 rounded-t-lg pl-10 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors h-[48px]" 
                  id="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  type="email" 
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-stack-sm mt-stack-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-primary hover:text-surface-tint transition-colors" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input 
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 focus:border-primary focus:ring-0 rounded-t-lg pl-10 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors h-[48px]" 
                  id="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  type="password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button 
              className="w-full h-[56px] mt-stack-md bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-stack-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account? 
              <a className="font-label-md text-label-md text-primary hover:text-surface-tint ml-1 transition-colors" href="#">Sign Up</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
