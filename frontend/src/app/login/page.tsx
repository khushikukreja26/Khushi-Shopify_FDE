'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://khushi-shopify-fde-4.onrender.com'; // safe fallback

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!API) throw new Error('Missing NEXT_PUBLIC_API_URL');

      const { data } = await axios.post(`${API}/api/auth/login`, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: false,
      });

      localStorage.setItem('token', data.token);
      if (data.tenantId) localStorage.setItem('tenantId', data.tenantId);
      router.replace('/');
    } catch (err: unknown) {
      const msg = (axios.isAxiosError(err) &&
        (typeof err.response?.data === 'string'
          ? err.response.data
          : (err.response?.data as any)?.error)) || (err as Error).message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Email</label>
          <input className="input w-full" type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Password</label>
          <input className="input w-full" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={loading} className="btn btn-solid w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
