'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, ArrowLeft, AlertCircle, ImagePlus, X } from 'lucide-react';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError('');

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('targetAmount', targetAmount);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Failed to launch campaign.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" /> Start New Campaign
          </h1>
          <p className="text-xs text-zinc-400">Publish your Mobile Money fundraiser.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Campaign Photo</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Campaign preview" className="w-full h-40 object-cover rounded-xl border border-zinc-800" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-40 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                <ImagePlus className="w-6 h-6 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">Tap to upload a photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Campaign Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Community Well Drilling Project" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Target Amount (UGX)</label>
            <input type="number" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="5000000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Description</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the cause and how funds will be used..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50">
            {loading ? 'Publishing Campaign...' : 'Publish Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}
