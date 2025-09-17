'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing Supabase connection...');
  const [contests, setContests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    console.log('Starting Supabase test...');

    try {
      // Test 1: Check if Supabase client exists
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Test 2: Try a simple query
      console.log('Attempting to fetch contests...');
      const { data, error } = await supabase
        .from('contests')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        setError(`Error: ${error.message}`);
        setStatus('Failed to connect to Supabase');
      } else {
        console.log('Success! Data:', data);
        setContests(data || []);
        setStatus(`Connected! Found ${data?.length || 0} contests`);
      }
    } catch (err) {
      console.error('Caught error:', err);
      setError(`Caught: ${err}`);
      setStatus('Connection failed');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      <div className="space-y-4">
        <div className="p-4 bg-dark-card rounded">
          <p className="font-semibold">Status:</p>
          <p className={error ? 'text-red-400' : 'text-green-400'}>{status}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 rounded">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="p-4 bg-dark-card rounded">
          <p className="font-semibold mb-2">Environment Variables:</p>
          <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
          <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
        </div>

        {contests.length > 0 && (
          <div className="p-4 bg-dark-card rounded">
            <p className="font-semibold mb-2">Contests Found:</p>
            {contests.map((contest: any) => (
              <p key={contest.id}>- {contest.name}</p>
            ))}
          </div>
        )}

        <button
          onClick={testConnection}
          className="px-4 py-2 bg-gem-crystal text-dark-bg rounded"
        >
          Retry Test
        </button>
      </div>
    </div>
  );
}