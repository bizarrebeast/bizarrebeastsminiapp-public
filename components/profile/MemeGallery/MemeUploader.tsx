'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AccessTier } from '@/lib/empire';
import { Upload, X, Image as ImageIcon, Tag, Globe, Lock, Loader } from 'lucide-react';
import { TIER_ACCESS_CONFIG } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MemeUploaderProps {
  userId: string;
  userTier: AccessTier;
  currentCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemeUploader({
  userId,
  userTier,
  currentCount,
  onClose,
  onSuccess
}: MemeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    is_public: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const access = TIER_ACCESS_CONFIG[userTier];
  const remainingUploads = access.uploadLimit - currentCount;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    const maxSize = parseInt(access.storageSize) * 1024 * 1024; // Convert MB to bytes
    if (selectedFile.size > maxSize) {
      alert(`File size exceeds ${access.storageSize} limit`);
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !formData.title) {
      alert('Please select a file and enter a title');
      return;
    }

    setUploading(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, create it first
        if (uploadError.message.includes('not found')) {
          // Create bucket (this would need to be done via Supabase dashboard)
          alert('Storage bucket not configured. Please contact admin.');
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName);

      // Save meme metadata to database
      const { data: memeData, error: dbError } = await supabase
        .from('user_memes')
        .insert({
          user_id: userId,
          title: formData.title,
          description: formData.description,
          image_url: publicUrl,
          thumbnail_url: publicUrl, // Could generate a smaller version
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          is_public: formData.is_public
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload meme. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upload Meme</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Limit Warning */}
        {remainingUploads <= 3 && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-500">
              ⚠️ You have {remainingUploads} upload{remainingUploads !== 1 ? 's' : ''} remaining in your {userTier} tier
            </p>
          </div>
        )}

        {/* File Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gem-purple transition"
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {access.storageSize}
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give your meme a catchy title"
              maxLength={100}
              className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg focus:outline-none focus:border-gem-purple"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your meme (optional)"
              rows={3}
              className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg focus:outline-none focus:border-gem-purple resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="funny, bizarre, dank (comma separated)"
              className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg focus:outline-none focus:border-gem-purple"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Visibility
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData({ ...formData, is_public: true })}
                className={`flex-1 py-2 px-4 rounded-lg border transition ${
                  formData.is_public
                    ? 'bg-gem-purple border-gem-purple'
                    : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Public
              </button>
              <button
                onClick={() => setFormData({ ...formData, is_public: false })}
                className={`flex-1 py-2 px-4 rounded-lg border transition ${
                  !formData.is_public
                    ? 'bg-gem-purple border-gem-purple'
                    : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !formData.title}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-gem-purple to-gem-crystal text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Meme
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}