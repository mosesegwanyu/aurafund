'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (res.ok && data.user?.role === 'ADMIN') {
        // Redirect directly to the administrative dashboard route
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Access denied: Invalid administrative credentials.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        
        <button 
          onClick={() => router.push('/')}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-400" /> Admin Portal
          </h1>
          <p className="text-xs text-zinc-400">
            Sign in with administrative credentials to access the backoffice.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@aurafund.app" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••••••" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

      </div>
    </div>
  );
}
