'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Megaphone } from 'lucide-react';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublicCampaigns() {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (err) {
        console.error('Error fetching home campaigns:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-white text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-400" /> AuraFund
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <Link href="/login" className="text-zinc-300 hover:text-white py-2">Sign In</Link>
          <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold">Start Campaign</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Active Fundraisers</h1>
          <p className="text-xs text-zinc-400">Support verified causes across Uganda via Mobile Money.</p>
        </div>

        {loading ? (
          <div className="text-xs font-mono text-zinc-500">Loading causes...</div>
        ) : campaigns.length === 0 ? (
          <div className="border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-sm">No active public campaigns right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map((c: any) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h2 className="font-bold text-white text-base">{c.title}</h2>
                <p className="text-xs text-zinc-400 line-clamp-2">{c.description}</p>
                <div className="space-y-1">
                  <div className="text-xs text-emerald-400 font-mono font-bold">
                    UGX {Number(c.raisedAmount || 0).toLocaleString()} raised
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Goal: UGX {Number(c.targetAmount).toLocaleString()}
                  </div>
                </div>
                <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2 rounded-xl font-mono">
                  Donate via Mobile Money
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
