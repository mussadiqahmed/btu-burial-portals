'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getHomePathForRole } from '@/lib/roles';
import { motion } from 'framer-motion';
import { User, Lock, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { username, password });
      login({ username: response.data.username, role: response.data.role });
      router.push(getHomePathForRole(response.data.role));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-indigo-50/30 px-4 dark:bg-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-blue-400/20 blur-3xl filter dark:bg-blue-900/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-purple-400/20 blur-3xl filter dark:bg-purple-900/20"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md space-y-8 rounded-3xl bg-white/80 p-10 shadow-2xl backdrop-blur-xl border border-white/20 dark:bg-gray-800/80 dark:border-gray-700/50"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 blur-xl opacity-50 animate-pulse"></div>
            <img src={process.env.NODE_ENV === 'production' ? '/portal/logo.png' : '/logo.png'} alt="Endless Eternity" className="relative mb-2 h-32 w-auto object-contain drop-shadow-md" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mt-4 text-gray-600 dark:text-gray-300"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium tracking-wide uppercase">
              Welcome Back
            </p>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </motion.div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200 flex items-center gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </motion.div>
          )}
          
          <div className="space-y-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="sr-only" htmlFor="username">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-800"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="sr-only" htmlFor="password">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-800"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-gray-900"
            >
              <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
