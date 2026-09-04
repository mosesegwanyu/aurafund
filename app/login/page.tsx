'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CampaignerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please check your network.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LogIn className="w-6 h-6 text-emerald-400" /> Campaigner Sign In
          </h1>
          <p className="text-xs text-zinc-400">Log in to manage your active campaigns.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="campaigner@aurafund.app" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-emerald-400 hover:underline font-medium">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
