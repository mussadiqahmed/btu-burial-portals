'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getHomePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';
import { PortalLogo } from '@/components/layout/PortalLogo';
import { PORTAL_NAME, PORTAL_ORG } from '@/lib/brand';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/login', { username, password });
      login({ username: response.data.username, role: response.data.role });
      toast.success('Welcome back!');
      router.push(getHomePathForRole(response.data.role));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(axiosErr.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 18, repeat: Infinity }}
        className="absolute -left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 22, repeat: Infinity }}
        className="absolute -bottom-1/4 -right-1/4 h-[50vh] w-[50vh] rounded-full bg-violet-500/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card gradient-border p-10 shadow-glow">
          <div className="mb-8 flex flex-col items-center text-center">
            <PortalLogo size="lg" className="mb-4 shadow-glow" />
            <h1 className="text-2xl font-bold text-foreground">{PORTAL_NAME}</h1>
            <p className="text-sm text-muted">{PORTAL_ORG}</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 py-3 pl-11 pr-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 py-3 pl-11 pr-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/25 hover:bg-primary-hover disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
