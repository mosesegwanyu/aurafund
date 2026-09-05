'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Megaphone, LogOut, LayoutDashboard, Pencil, Trash2 } from 'lucide-react';

export default function CampaignerDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns/me');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete campaign.');
      }
    } catch (err) {
      alert('Connection error while deleting campaign.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-white text-sm">Campaigner Workspace</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Your Campaigns</h1>
            <p className="text-xs text-zinc-400">Manage and track live Mobile Money contributions.</p>
          </div>
          <Link href="/campaigns/new" className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors">
            <PlusCircle className="w-4 h-4" /> Create Campaign
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-4 bg-zinc-900/30">
            <Megaphone className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No Active Campaigns</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">You currently have no active campaigns. Create your first campaign to begin receiving donations.</p>
            </div>
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-xs font-mono font-bold">
              <PlusCircle className="w-4 h-4" /> Launch First Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c: any) => (
              <div key={c.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 flex gap-4 items-start">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.title} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{c.title}</h3>
                  <p className="text-xs text-zinc-400">Target: UGX {Number(c.targetAmount).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link
                    href={`/campaigns/${c.id}/edit`}
                    className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.title)}
                    disabled={deletingId === c.id}
                    className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" /> {deletingId === c.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
