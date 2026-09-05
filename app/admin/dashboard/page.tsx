'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, AlertCircle, Wallet, Users, Megaphone, Send, Trash2 } from 'lucide-react';

type Campaign = {
  id: string;
  title: string;
  targetAmount: number;
  raisedAmount: number;
  user: { name: string; email: string; phone: string | null };
};

type Transaction = {
  id: string;
  type: 'DONATION' | 'WITHDRAWAL';
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  amount: number;
  reference: string;
  phone: string | null;
  createdAt: string;
  campaign: { title: string };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [totals, setTotals] = useState({ totalRaised: 0, totalWithdrawn: 0, totalUsers: 0, totalCampaigns: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [payoutCampaignId, setPayoutCampaignId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      setTotals(data.totals);
      setCampaigns(data.campaigns);
      setTransactions(data.recentTransactions);
      setStatus('ok');
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutMessage('');

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          campaignId: payoutCampaignId,
          amount: payoutAmount,
          momoNumber: payoutNumber,
        }),
      });
      const data = await res.json();
      setPayoutLoading(false);

      if (res.ok) {
        setPayoutMessage('Payout initiated. It will show as PENDING below until Flutterwave confirms it.');
        setPayoutAmount('');
        setPayoutNumber('');
        loadOverview();
      } else {
        setPayoutMessage(data.error || 'Payout failed.');
      }
    } catch (err) {
      setPayoutLoading(false);
      setPayoutMessage('Connection error while initiating payout.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}"? This will permanently remove the campaign and its records. This cannot be undone.`);
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

  const statusColor = (s: string) =>
    s === 'SUCCESSFUL' ? 'text-emerald-400' : s === 'FAILED' ? 'text-red-400' : 'text-amber-400';

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

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase"><Wallet className="w-3.5 h-3.5" /> Total Raised</div>
            <div className="text-lg font-bold text-emerald-400">UGX {totals.totalRaised.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase"><Send className="w-3.5 h-3.5" /> Total Paid Out</div>
            <div className="text-lg font-bold text-amber-400">UGX {totals.totalWithdrawn.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase"><Megaphone className="w-3.5 h-3.5" /> Campaigns</div>
            <div className="text-lg font-bold text-white">{totals.totalCampaigns}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase"><Users className="w-3.5 h-3.5" /> Users</div>
            <div className="text-lg font-bold text-white">{totals.totalUsers}</div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Initiate a Payout</h2>
          <form onSubmit={handlePayout} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Campaign</label>
              <select
                required
                value={payoutCampaignId}
                onChange={(e) => setPayoutCampaignId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">Select campaign...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (Raised UGX {c.raisedAmount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Amount (UGX)</label>
              <input
                required
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Mobile Money Number</label>
              <input
                required
                type="text"
                placeholder="0700000000"
                value={payoutNumber}
                onChange={(e) => setPayoutNumber(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={payoutLoading}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-xs font-mono disabled:opacity-50"
              >
                {payoutLoading ? 'Sending...' : 'Send Payout'}
              </button>
              {payoutMessage && <span className="ml-3 text-xs text-zinc-400">{payoutMessage}</span>}
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Campaigns</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="p-3 font-mono">Title</th>
                  <th className="p-3 font-mono">Owner</th>
                  <th className="p-3 font-mono">Raised</th>
                  <th className="p-3 font-mono">Target</th>
                  <th className="p-3 font-mono">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-900 last:border-0">
                    <td className="p-3 text-white">{c.title}</td>
                    <td className="p-3 text-zinc-400">{c.user?.name} ({c.user?.phone || c.user?.email})</td>
                    <td className="p-3 text-emerald-400 font-mono">UGX {c.raisedAmount.toLocaleString()}</td>
                    <td className="p-3 text-zinc-500 font-mono">UGX {c.targetAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        disabled={deletingId === c.id}
                        className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> {deletingId === c.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="p-3 font-mono">Type</th>
                  <th className="p-3 font-mono">Campaign</th>
                  <th className="p-3 font-mono">Amount</th>
                  <th className="p-3 font-mono">Phone</th>
                  <th className="p-3 font-mono">Status</th>
                  <th className="p-3 font-mono">When</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-900 last:border-0">
                    <td className="p-3 text-zinc-300">{t.type}</td>
                    <td className="p-3 text-zinc-400">{t.campaign?.title}</td>
                    <td className="p-3 text-white font-mono">UGX {t.amount.toLocaleString()}</td>
                    <td className="p-3 text-zinc-500 font-mono">{t.phone || '—'}</td>
                    <td className={`p-3 font-mono font-bold ${statusColor(t.status)}`}>{t.status}</td>
                    <td className="p-3 text-zinc-500">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-600">No transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
