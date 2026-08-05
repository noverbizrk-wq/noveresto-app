'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

const NAVY = '#0D2137';
const TEAL = 'var(--accent)';

interface SummaryRow {
  gross_revenue: string;
  net_revenue: string;
  order_count: string;
  cancelled_count: string;
  avg_ticket: string;
  channel_label: string | null;
  channel_revenue: string;
}

export default function RestaurantOverviewPage() {
  const { restaurant, restaurants, selectRestaurant, token, loading: restaurantLoading, error: restaurantError } = useCurrentRestaurant();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant || !token) return;
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const to = new Date().toISOString();

    api.restaurantDashboardSummary(token, restaurant.id, from, to)
      .then((json) => setSummary(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  const totals = summary.find((r) => r.channel_label === null);
  const byChannel = summary.filter((r) => r.channel_label !== null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          📊 Pilotage <span style={{ color: TEAL }}>du restaurant</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {(restaurantLoading || loading) && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {(restaurantError || error) && <p style={{ color: 'var(--danger)' }}>{restaurantError || error}</p>}

      {!restaurantLoading && !loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="CA brut (jour)" value={`${Number(totals?.gross_revenue ?? 0).toFixed(3)} TND`} />
            <KpiCard label="CA net (jour)" value={`${Number(totals?.net_revenue ?? 0).toFixed(3)} TND`} />
            <KpiCard label="Commandes" value={totals?.order_count ?? '0'} />
            <KpiCard label="Panier moyen" value={`${Number(totals?.avg_ticket ?? 0).toFixed(3)} TND`} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>CA par canal</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="channel_label" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  formatter={(v) => `${Number(v).toFixed(3)} TND`}
                  contentStyle={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Bar dataKey="channel_revenue" fill={TEAL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!restaurantLoading && !loading && !error && summary.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Aucune commande sur la période sélectionnée.</p>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: TEAL }}></div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
