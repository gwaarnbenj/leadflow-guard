'use client';
import { useState } from 'react';

export default function Onboarding() {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'form'|'phone'|'booking'|'checkout'>('form');
  const [pageUrl, setPageUrl] = useState('');
  const [successMode, setSuccessMode] = useState<'thank_you_url'|'success_selector'|'provider_state'>('thank_you_url');
  const [thankYouUrl, setThankYouUrl] = useState('');
  const [successSelector, setSuccessSelector] = useState('');
  const [provider, setProvider] = useState('elementor');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const siteRes = await fetch('/api/sites', { 
      method:'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const { site_id } = await siteRes.json();

    const goalRes = await fetch('/api/goals', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id, 
        type, 
        page_url: pageUrl, 
        success_mode: successMode,
        thank_you_url: thankYouUrl || null, 
        success_selector: successSelector || null, 
        provider
      })
    });
    const { goal_id } = await goalRes.json();

    await fetch('/api/check-now', { 
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id })
    });

    window.location.href = '/dashboard';
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Set up your first Lead Check</h1>

      <label className="block text-sm font-medium">Website URL</label>
      <input 
        className="border p-2 w-full" 
        placeholder="https://example.com" 
        value={url} 
        onChange={e=>setUrl(e.target.value)} 
      />

      <label className="block text-sm font-medium mt-4">Main goal</label>
      <select 
        className="border p-2 w-full" 
        value={type} 
        onChange={e=>setType(e.target.value as any)}
      >
        <option value="form">Contact/Quote Form</option>
        <option value="phone">Phone Call Button</option>
        <option value="booking">Booking Widget</option>
        <option value="checkout">Checkout</option>
      </select>

      <label className="block text-sm font-medium mt-4">Where does it happen? (page URL)</label>
      <input 
        className="border p-2 w-full" 
        placeholder="/contact" 
        value={pageUrl} 
        onChange={e=>setPageUrl(e.target.value)} 
      />

      <label className="block text-sm font-medium mt-4">How do you know it worked?</label>
      <select 
        className="border p-2 w-full" 
        value={successMode} 
        onChange={e=>setSuccessMode(e.target.value as any)}
      >
        <option value="thank_you_url">Redirect to a Thank-you page</option>
        <option value="success_selector">Shows a success message</option>
        <option value="provider_state">Provider confirmation (Calendly/Shopify)</option>
      </select>

      {successMode === 'thank_you_url' && (
        <>
          <label className="block text-sm font-medium mt-2">Thank-you URL</label>
          <input 
            className="border p-2 w-full" 
            placeholder="/thank-you" 
            value={thankYouUrl} 
            onChange={e=>setThankYouUrl(e.target.value)} 
          />
        </>
      )}
      {successMode === 'success_selector' && (
        <>
          <label className="block text-sm font-medium mt-2">Success selector</label>
          <input 
            className="border p-2 w-full" 
            placeholder=".elementor-message-success" 
            value={successSelector} 
            onChange={e=>setSuccessSelector(e.target.value)} 
          />
        </>
      )}

      <label className="block text-sm font-medium mt-4">Provider (helps with defaults)</label>
      <select 
        className="border p-2 w-full" 
        value={provider} 
        onChange={e=>setProvider(e.target.value)}
      >
        <option value="elementor">Elementor</option>
        <option value="cf7">Contact Form 7</option>
        <option value="gravity">Gravity Forms</option>
        <option value="wpforms">WPForms</option>
        <option value="calendly">Calendly</option>
        <option value="shopify">Shopify</option>
        <option value="custom">Custom</option>
      </select>

      <button 
        onClick={submit} 
        disabled={loading} 
        className="mt-6 bg-black text-white px-4 py-2 rounded"
      >
        {loading ? 'Setting up…' : 'Start Monitoring'}
      </button>
    </main>
  );
}
