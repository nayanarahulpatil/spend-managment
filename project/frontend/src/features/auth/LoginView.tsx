import React, { useState } from 'react';
import { useLoginMutation } from '../../services/api';
import { AlertTriangle, Eye, Loader, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (creds: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('employee@company.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [login, { isLoading }] = useLoginMutation();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = { email, password };
      const response = await login(payload).unwrap();
      if (response.status === 200) {
        onLoginSuccess(response.data);
      }
    } catch (err: any) {
      if (err.status === 423) {
        setErrorMsg('Account locked due to 5 consecutive failures. Contact admin.');
      } else {
        setErrorMsg(err.data?.message || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-on-surface">
      {/* Left Side: Abstract Branding Graphic */}
      <section className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-background border-r border-glass-border">
        {/* Decorative Blur Background Graphic */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/5 rounded-full blur-3xl" />

        <div className="relative z-10 p-10 max-w-xl">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-4xl font-bold tracking-tighter text-electric-blue">Equinox Finance</span>
          </div>
          <h1 className="text-3xl font-semibold mb-4 leading-tight text-white font-headline-xl">
            Effortless Enterprise Spend Management.
          </h1>
          <p className="text-sm text-on-surface-variant mb-10 leading-relaxed opacity-85">
            Harness the power of AI-augmented fiscal oversight with a platform built for global scale and local precision.
          </p>

          {/* High Fidelity UI Mockup Element */}
          <div className="glass-card p-6 rounded-xl shadow-2xl relative border border-glass-border">
            <div className="flex items-center gap-1.5 mb-6">
              <div className="w-3 h-3 rounded-full bg-ruby-violation"></div>
              <div className="w-3 h-3 rounded-full bg-amber-pending"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-success"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-white/10 rounded"></div>
              <div className="h-4 w-1/2 bg-white/5 rounded"></div>
              <div className="pt-4 flex justify-between items-center">
                <div className="h-8 w-24 bg-electric-blue/20 rounded border border-electric-blue/30 flex items-center justify-center text-[10px] text-electric-blue font-mono tracking-wider font-bold">
                  AI COMPLIANT
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">★</div>
              </div>
            </div>
            {/* Decorative Radial Glow */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-electric-blue/15 blur-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* Attribution Footer */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 text-on-surface-variant opacity-50 text-[10px] font-mono">
          <span>SECURED BY TITAN QUANTUM CRYPTO</span>
        </div>
      </section>

      {/* Right Side: Login Form Canvas */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          {errorMsg && (
            <div className="px-4 py-3 rounded-lg bg-ruby-violation/10 border border-ruby-violation/30 text-ruby-violation text-sm flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Container */}
          <div className="transition-all duration-500">
            <div className="text-left mb-8">
              <h2 className="text-3xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant">Access your secure financial dashboard.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant mb-1.5">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input rounded-lg px-4 py-3 text-sm text-white focus:outline-none"
                  placeholder="name@company.com"
                />
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant">Password</label>
                  <a className="text-xs font-mono text-electric-blue hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input rounded-lg px-4 py-3 text-sm text-white pr-10 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border bg-slate-800 text-electric-blue focus:ring-electric-blue/50"
                />
                <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-electric-blue text-slate-900 font-bold rounded-lg text-sm hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg glow-accent"
              >
                {isLoading && <Loader className="animate-spin" size={16} />}
                <span>Sign In</span>
              </button>
            </form>

            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-glass-border"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-on-surface-variant">OR CONTINUE WITH SSO</span>
              <div className="flex-grow border-t border-glass-border"></div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-lg hover:bg-slate-100 transition-all text-xs font-semibold shadow-lg">
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Accessibility/Legal Footer */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-on-surface-variant font-mono text-[9px] opacity-60">
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <span>•</span>
            <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
            <span>•</span>
            <a className="hover:text-white transition-colors" href="#">Compliance</a>
          </div>
        </div>
      </section>
    </div>
  );
}
