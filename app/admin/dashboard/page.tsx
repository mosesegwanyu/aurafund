'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin');
        const data = await res.json();

        if (!res.ok) {
          // Not an admin (or not logged in) — send them away.
          router.push('/admin/login');
          return;
        }

        setMessage(data.message || 'Welcome, Administrator.');
        setStatus('ok');
      } catch (err) {
        setStatus('error');
      }
    }
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-500">Checking administrator session...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-4">
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Connection failed. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-white text-sm">Admin Backoffice</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold text-white">Administrator Overview</h1>
        <p className="text-xs text-zinc-400">{message}</p>
        <p className="text-xs text-zinc-500">
          This is a starting point — wire up campaign moderation, user management, and payout
          approval tools here as needed.
        </p>
      </main>
    </div>
  );
}
