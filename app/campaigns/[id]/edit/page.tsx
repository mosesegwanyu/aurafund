'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, ArrowLeft, AlertCircle, ImagePlus, X, Trash2 } from 'lucide-react';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId) return;

    async function loadCampaign() {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load campaign.');
          return;
        }

        setTitle(data.campaign.title);
        setTargetAmount(String(data.campaign.targetAmount));
        setDescription(data.campaign.description);
        setExistingImageUrl(data.campaign.imageUrl || null);
      } catch (err) {
        setError('Connection error while loading campaign.');
      } finally {
        setPageLoading(false);
      }
    }

    loadCampaign();
  }, [campaignId]);

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
    setRemoveExistingImage(false);
  };

  const removeNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const removeCurrentImage = () => {
    setExistingImageUrl(null);
    setRemoveExistingImage(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('targetAmount', targetAmount);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (removeExistingImage) {
        formData.append('removeImage', 'true');
      }

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Failed to save changes.');
      }
    } catch (err) {
      setSaving(false);
      setError('Connection error. Try again.');
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-500">Loading campaign...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" /> Edit Campaign
          </h1>
          <p className="text-xs text-zinc-400">Update your fundraiser's details.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Campaign Photo</label>

            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="New campaign photo" className="w-full h-40 object-cover rounded-xl border border-zinc-800" />
                <button type="button" onClick={removeNewImage} className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : existingImageUrl ? (
              <div className="relative">
                <img src={existingImageUrl} alt="Current campaign photo" className="w-full h-40 object-cover rounded-xl border border-zinc-800" />
                <button
                  type="button"
                  onClick={removeCurrentImage}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 flex items-center gap-1 text-[10px] px-2"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <label className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white rounded-lg px-2 py-1 text-[10px] font-mono cursor-pointer">
                  Replace
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
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
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Target Amount (UGX)</label>
            <input type="number" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">Description</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none" />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl text-xs uppercase font-mono transition-colors disabled:opacity-50">
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
