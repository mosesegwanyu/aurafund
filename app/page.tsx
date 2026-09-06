'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Megaphone, X, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';

type CampaignType = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  raisedAmount: number;
  targetAmount: number;
};

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(true);

  const [donateTarget, setDonateTarget] = useState<CampaignType | null>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [donatePhone, setDonatePhone] = useState('');
  const [donateNetwork, setDonateNetwork] = useState('MTN');
  const [donorName, setDonorName] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [donateSuccess, setDonateSuccess] = useState(false);

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

  const openDonateModal = (campaign: CampaignType) => {
    setDonateTarget(campaign);
    setDonateAmount('');
    setDonatePhone('');
    setDonorName('');
    setDonateError('');
    setDonateSuccess(false);
  };

  const closeDonateModal = () => {
    setDonateTarget(null);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateTarget) return;

    setDonateLoading(true);
    setDonateError('');

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'donate',
          campaignId: donateTarget.id,
          amount: donateAmount,
          phone: donatePhone,
          network: donateNetwork,
          donorName: donorName || 'Anonymous',
        }),
      });

      const data = await res.json();
      setDonateLoading(false);

      if (res.ok) {
        setDonateSuccess(true);
      } else {
        setDonateError(data.error || 'Failed to start donation. Please try again.');
      }
    } catch (err) {
      setDonateLoading(false);
      setDonateError('Connection error. Please try again.');
    }
  };

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
            {campaigns.map((c) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden space-y-4">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-zinc-800 flex items-center justify-center">
                    <Megaphone className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
                <div className="px-5 pb-5 space-y-4">
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
                <button
                  onClick={() => openDonateModal(c)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2.5 rounded-xl font-mono transition-colors"
                >
                  Donate via Mobile Money
                </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {donateTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 relative">
            <button onClick={closeDonateModal} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            {donateSuccess ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-white text-sm">Check your phone</h3>
                <p className="text-xs text-zinc-400">
                  A Mobile Money prompt has been sent to {donatePhone}. Enter your PIN on your phone to
                  complete the UGX {Number(donateAmount).toLocaleString()} donation to "{donateTarget.title}".
                </p>
                <button
                  onClick={closeDonateModal}
                  className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded-xl font-mono"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Donate to "{donateTarget.title}"</h3>
                </div>

                {donateError && (
                  <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{donateError}</span>
                  </div>
                )}

                <form onSubmit={handleDonate} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Amount (UGX)</label>
                    <input
                      required
                      type="number"
                      min={500}
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      placeholder="10000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Mobile Money Number</label>
                    <input
                      required
                      type="tel"
                      value={donatePhone}
                      onChange={(e) => setDonatePhone(e.target.value)}
                      placeholder="0700000000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Network</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDonateNetwork('MTN')}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                          donateNetwork === 'MTN'
                            ? 'bg-yellow-400 border-yellow-400 text-black'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        MTN
                      </button>
                      <button
                        type="button"
                        onClick={() => setDonateNetwork('AIRTEL')}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                          donateNetwork === 'AIRTEL'
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Airtel
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Your Name (optional)</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Anonymous"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={donateLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50"
                  >
                    {donateLoading ? 'Sending Prompt...' : 'Send Payment Prompt'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
