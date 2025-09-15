'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL!;
type Overview = { totalCustomers: number; totalOrders: number; totalRevenue: number };

// ---------- UI bits ----------
function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card p-4 md:p-5 bg-pink-50 border border-pink-200 rounded-lg shadow">
      <div className="text-xs text-pink-700">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

// ---------- Mock data for the 2nd store ----------
const SECOND_TENANT_ID = 'second-shop-id'; // keep in sync with TenantSwitcher extra store

const MOCK_OVERVIEW: Overview = {
  totalCustomers: 128,
  totalOrders: 342,
  totalRevenue: 673245.5,
};

const MOCK_SERIES = [
  { d: '2025-09-01', orders: 8 },
  { d: '2025-09-02', orders: 12 },
  { d: '2025-09-03', orders: 7 },
  { d: '2025-09-04', orders: 15 },
  { d: '2025-09-05', orders: 10 },
  { d: '2025-09-06', orders: 14 },
  { d: '2025-09-07', orders: 18 },
];

const MOCK_TOPS = [
  { email: 'aisha@example.com', spend: 21500 },
  { email: 'rahul@example.com', spend: 18900 },
  { email: 'neha@example.com', spend: 17450 },
  { email: 'dev@example.com', spend: 16200 },
  { email: 'kiran@example.com', spend: 15100 },
];

// ---------- Tenant Switcher (safe localStorage + extra store) ----------
function TenantSwitcher({ onChange }: { onChange: () => void }) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenant, setActiveTenant] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    axios
      .get(`${API}/api/tenants`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        // ✅ Extra demo store (mock data)
        const extra = [
          { id: SECOND_TENANT_ID, name: 'Second Shop', shopDomain: 'second-shop.myshopify.com' },
        ];
        const list = [...res.data, ...extra];

        setTenants(list);

        const saved = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
        const valid = saved && list.some((t) => t.id === saved) ? saved : list[0]?.id ?? null;

        setActiveTenant(valid);
        if (valid) localStorage.setItem('tenantId', valid);
        onChange();
      })
      .catch((err) => console.error(err));
  }, [onChange]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTenant = e.target.value;
    setActiveTenant(newTenant);
    if (typeof window !== 'undefined') localStorage.setItem('tenantId', newTenant);
    onChange();
  }

  return (
    <div className="mb-4">
      <label className="mr-2 text-sm text-gray-600">Select Store:</label>
      <select
        value={activeTenant ?? ''}
        onChange={handleChange}
        className="border border-pink-300 rounded px-2 py-1 focus:ring-pink-400 focus:border-pink-400"
      >
        {tenants.length === 0 && <option value="">Loading…</option>}
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.shopDomain})
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------- Page ----------
export default function Home() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [tops, setTops] = useState<any[]>([]);
  const [from, setFrom] = useState('2000-01-01');
  const [to, setTo] = useState('2099-12-31');

  function auth() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (!tenantId) window.location.href = '/login';
    return { token, tenantId };
  }

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      window.location.href = '/login';
    }
  }

  async function load() {
    const { token, tenantId } = auth();
    if (!tenantId) return;

    // If the second store is selected, show mock data
    if (tenantId === SECOND_TENANT_ID) {
      setOverview(MOCK_OVERVIEW);
      setSeries(MOCK_SERIES);
      setTops(MOCK_TOPS);
      return;
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    // 🔥 cache buster so this page always fetches fresh data
    const ts = Date.now();

    const [o, s, t] = await Promise.all([
      axios.get(`${API}/api/sync/${tenantId}/metrics/overview`, { headers, params: { ts } }),
      axios.get(`${API}/api/sync/${tenantId}/metrics/orders-by-date`, { headers, params: { from, to, ts } }),
      axios.get(`${API}/api/sync/${tenantId}/metrics/top-customers`, { headers, params: { ts } }),
    ]);

    setOverview(o.data);
    setSeries(s.data);
    setTops(t.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ B) ONLY this page listens for data updates and tab focus to refresh
  useEffect(() => {
    const onUpdated = () => load();
    const onFocus = () => load();

    window.addEventListener('metrics:updated', onUpdated);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('metrics:updated', onUpdated);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6 p-6 bg-pink-50 min-h-screen">
      {/* Header */}
      <div className="card p-4 md:p-5 flex items-center justify-between bg-white border border-pink-200 rounded-lg shadow">
        <div className="text-xl font-semibold text-gray-900">Insights Dashboard</div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-pink-500 text-white rounded shadow hover:bg-pink-600" onClick={load}>
            Refresh
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded shadow hover:bg-gray-300" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Tenant Switcher */}
      <TenantSwitcher onChange={load} />

      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Customers" value={overview?.totalCustomers ?? 0} />
        <Card title="Total Orders" value={overview?.totalOrders ?? 0} />
        <Card title="Total Revenue" value={`₹ ${(overview?.totalRevenue ?? 0).toFixed(2)}`} />
      </section>

      {/* Orders Chart */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input className="border rounded p-2 bg-white" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-gray-700">to</span>
          <input className="border rounded p-2 bg-white" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="px-4 py-2 bg-pink-500 text-white rounded shadow hover:bg-pink-600" onClick={load}>
            Filter
          </button>
        </div>

        <div className="card p-3 h-72 bg-white border border-pink-200 rounded-lg shadow">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fbcfe8" />
              <XAxis dataKey="d" tick={{ fill: '#111827' }} />
              <YAxis tick={{ fill: '#111827' }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#f35098" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top Customers */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Top 5 Customers</h2>
        <div className="card p-3 h-72 bg-white border border-pink-200 rounded-lg shadow">
          <ResponsiveContainer>
            <BarChart data={tops}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fbcfe8" />
              <XAxis dataKey="email" tick={{ fill: '#111827' }} />
              <YAxis tick={{ fill: '#111827' }} />
              <Tooltip />
              <Bar dataKey="spend" fill="#fb79a5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
