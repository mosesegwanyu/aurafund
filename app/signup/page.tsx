'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Mail, Lock, Phone, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CampaignerSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, phone, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Failed to register account.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
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
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Create Account
          </h1>
          <p className="text-xs text-zinc-400">Launch campaigns & receive Mobile Money donations.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Moses Egwanyu" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="campaigner@aurafund.app" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Mobile Money Phone Number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0770000000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account & Continue'}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
