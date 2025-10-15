'use client';

import { useState, useRef } from 'react';
import { Send, Mail, MessageSquare, Palette, Handshake, HelpCircle, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

type ContactCategory = 'partnership' | 'general' | 'feedback' | 'commission' | 'other';
type ContactMethod = 'email' | 'farcaster' | 'x';

interface FormData {
  name: string;
  contactMethod: ContactMethod;
  email: string;
  farcasterHandle: string;
  xHandle: string;
  category: ContactCategory;
  subject: string;
  message: string;
  image?: File;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactMethod: 'email',
    email: '',
    farcasterHandle: '',
    xHandle: '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot trap
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'partnership', label: 'Collabs & Partnerships', icon: Handshake },
    { value: 'general', label: 'General Inquiry', icon: MessageSquare },
    { value: 'feedback', label: 'Beta Feedback', icon: Mail },
    { value: 'commission', label: 'Art Commission', icon: Palette },
    { value: 'other', label: 'Other', icon: HelpCircle },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image must be smaller than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File must be an image');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: undefined }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      setIsSubmitting(false);
      return; // Silently fail for bots
    }

    // Turnstile check
    if (!turnstileToken) {
      setErrorMessage('Please complete the security verification');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for multipart upload (handles image + JSON)
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('contactMethod', formData.contactMethod);
      submitData.append('email', formData.email);
      submitData.append('farcasterHandle', formData.farcasterHandle);
      submitData.append('xHandle', formData.xHandle);
      submitData.append('category', formData.category);
      submitData.append('subject', formData.subject);
      submitData.append('message', formData.message);
      submitData.append('turnstileToken', turnstileToken);

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: submitData, // Don't set Content-Type - browser sets it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        contactMethod: 'email',
        email: '',
        farcasterHandle: '',
        xHandle: '',
        category: 'general',
        subject: '',
        message: '',
      });
      setImagePreview(null);
      setTurnstileToken('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Contact BizarreBeasts
          </h1>
          <p className="text-gray-300 text-lg">
            Have a question, feedback, or want to collaborate with BizarreBeasts? Reach out below.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gem-crystal mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all"
                placeholder="Your name"
              />
            </div>

            {/* Contact Method Selector */}
            <div>
              <label className="block text-sm font-semibold text-gem-crystal mb-3">
                Preferred Contact Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'email' }))}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    formData.contactMethod === 'email'
                      ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                      : 'bg-dark-bg border border-gem-crystal/30 text-gray-400 hover:border-gem-crystal/50'
                  }`}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'farcaster' }))}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    formData.contactMethod === 'farcaster'
                      ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                      : 'bg-dark-bg border border-gem-crystal/30 text-gray-400 hover:border-gem-crystal/50'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.24 2H5.76A3.76 3.76 0 002 5.76v12.48A3.76 3.76 0 005.76 22h12.48A3.76 3.76 0 0022 18.24V5.76A3.76 3.76 0 0018.24 2zm-1.32 15.44h-2.16v-6.72c0-1.68-1.08-2.64-2.52-2.64-1.32 0-2.28.84-2.28 2.16v7.2H7.8V6.56h2.16v1.2c.48-.84 1.44-1.44 2.64-1.44 2.28 0 4.32 1.56 4.32 4.44v6.68z"/>
                  </svg>
                  <span className="truncate">Farcaster</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'x' }))}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    formData.contactMethod === 'x'
                      ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                      : 'bg-dark-bg border border-gem-crystal/30 text-gray-400 hover:border-gem-crystal/50'
                  }`}
                >
                  𝕏 Twitter/X
                </button>
              </div>
            </div>

            {/* Conditional Contact Fields */}
            {formData.contactMethod === 'email' && (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gem-crystal mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
            )}

            {formData.contactMethod === 'farcaster' && (
              <div>
                <label htmlFor="farcasterHandle" className="block text-sm font-semibold text-gem-crystal mb-2">
                  Farcaster Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    id="farcasterHandle"
                    name="farcasterHandle"
                    value={formData.farcasterHandle}
                    onChange={handleChange}
                    required
                    className="w-full pl-8 pr-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all"
                    placeholder="yourhandle"
                  />
                </div>
              </div>
            )}

            {formData.contactMethod === 'x' && (
              <div>
                <label htmlFor="xHandle" className="block text-sm font-semibold text-gem-crystal mb-2">
                  X/Twitter Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    id="xHandle"
                    name="xHandle"
                    value={formData.xHandle}
                    onChange={handleChange}
                    required
                    className="w-full pl-8 pr-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all"
                    placeholder="yourhandle"
                  />
                </div>
              </div>
            )}

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gem-crystal mb-2">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {categories.find(c => c.value === formData.category)?.icon && (
                    <div className="text-gem-crystal">
                      {(() => {
                        const Icon = categories.find(c => c.value === formData.category)!.icon;
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gem-crystal mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all"
                placeholder="Brief subject of your message"
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gem-crystal mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-dark-bg border border-gem-crystal/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gem-gold focus:ring-2 focus:ring-gem-gold/20 transition-all resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            {/* Image Upload Field (Optional) */}
            <div>
              <label htmlFor="image" className="block text-sm font-semibold text-gem-crystal mb-2">
                Attach Image (Optional)
              </label>
              <p className="text-gray-400 text-xs mb-3">Max 5MB • PNG, JPG, GIF, or WEBP</p>

              {!imagePreview ? (
                <label
                  htmlFor="image"
                  className="w-full px-4 py-8 bg-dark-bg border-2 border-dashed border-gem-crystal/30 rounded-lg text-white hover:border-gem-gold/50 focus:border-gem-gold transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                >
                  <Upload className="w-8 h-8 text-gem-crystal group-hover:text-gem-gold transition-colors" />
                  <div className="text-center">
                    <p className="text-gray-300 font-medium">Click to upload an image</p>
                    <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative w-full bg-dark-bg border border-gem-crystal/30 rounded-lg p-4">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all z-10"
                    aria-label="Remove image"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Turnstile Captcha */}
            <div>
              <label className="block text-sm font-semibold text-gem-crystal mb-3">
                Security Verification *
              </label>
              <div className="flex justify-center sm:justify-start">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setErrorMessage('Captcha verification failed. Please try again.')}
                  onExpire={() => setTurnstileToken('')}
                  options={{
                    theme: 'dark',
                    size: 'normal',
                  }}
                />
              </div>
            </div>

            {/* Honeypot field - hidden from users, catches bots */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 border border-gem-crystal/40 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                <CheckCircle className="w-6 h-6 text-gem-crystal flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gem-crystal mb-1">Message Sent!</h3>
                  <p className="text-gray-300 text-sm">
                    Thanks for reaching out! We'll get back to you as soon as possible.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="bg-gradient-to-r from-red-500/20 to-gem-pink/20 border border-red-500/40 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-400 mb-1">Error</h3>
                  <p className="text-gray-300 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Social Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-4">Or connect with BizarreBeasts ($BB) on social media</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://warpcast.com/bizarrebeast"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.24 2H5.76A3.76 3.76 0 002 5.76v12.48A3.76 3.76 0 005.76 22h12.48A3.76 3.76 0 0022 18.24V5.76A3.76 3.76 0 0018.24 2zm-1.32 15.44h-2.16v-6.72c0-1.68-1.08-2.64-2.52-2.64-1.32 0-2.28.84-2.28 2.16v7.2H7.8V6.56h2.16v1.2c.48-.84 1.44-1.44 2.64-1.44 2.28 0 4.32 1.56 4.32 4.44v6.68z"/>
              </svg>
              <span className="font-semibold">@bizarrebeast</span>
            </a>
            <a
              href="https://x.com/bizarrebeasts_"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="font-semibold">@bizarrebeasts_</span>
            </a>
          </div>
        </div>

        {/* Category Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.value}
                className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 hover:border-gem-crystal/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-gem-crystal/20 to-gem-gold/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gem-crystal" />
                  </div>
                  <h3 className="font-bold text-white">{cat.label}</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  {cat.value === 'partnership' && 'Explore collaboration opportunities and partnerships'}
                  {cat.value === 'general' && 'Questions about BizarreBeasts and our ecosystem'}
                  {cat.value === 'feedback' && 'Share your beta testing experience and suggestions'}
                  {cat.value === 'commission' && 'Commission custom BizarreBeasts artwork'}
                  {cat.value === 'other' && 'Anything else you would like to discuss'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
