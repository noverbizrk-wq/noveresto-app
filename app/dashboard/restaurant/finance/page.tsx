'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface VatRow {
  vat_rate: string;
  revenue_ttc: string;
  revenue_ht: string;
  vat_amount: string;
}

interface ChannelRow {
  channel_label: string;
  order_count: string;
  gross: string;
  discounts: string;
  commissions: string;
  net: string;
}

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function FinancePage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [vatData, setVatData] = useState<VatRow[]>([]);
  const [channelData, setChannelData] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantVatBreakdown(token, restaurant.id, from, to),
      api.restaurantChannelBreakdown(token, restaurant.id, from, to)
    ])
      .then(([vatJson, channelJson]) => {
        setVatData(vatJson.data || []);
        setChannelData(channelJson.data || []);
      })
      .finally(() => setLoading(false));
  }, [restaurant, token, from, to]);

  useEffect(() => { load(); }, [load]);

  const downloadCsv = async () => {
    if (!restaurant || !token) return;
    setExporting(true);
    try {
      const url = api.restaurantExportCsvUrl(restaurant.id, from, to);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `commandes_${from}_${to}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  };

  const totalHT = vatData.reduce((s, r) => s + Number(r.revenue_ht), 0);
  const totalVat = vatData.reduce((s, r) => s + Number(r.vat_amount), 0);
  const totalTTC = vatData.reduce((s, r) => s + Number(r.revenue_ttc), 0);

  const inp: React.CSSProperties = {
    background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8,
    padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)'
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          💰 Finance <span style={{ color: 'var(--accent)' }}>et TVA</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inp} />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inp} />
          <button
            onClick={downloadCsv}
            disabled={exporting}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {exporting ? '...' : '⬇ Export CSV'}
          </button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}

      {!loading && (
        <>
          <div className="nr-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="CA HT" value={`${totalHT.toFixed(3)} TND`} />
            <KpiCard label="TVA collectée" value={`${totalVat.toFixed(3)} TND`} />
            <KpiCard label="CA TTC" value={`${totalTTC.toFixed(3)} TND`} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Ventilation par taux de TVA</h2>
            <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: 12 }}>Taux</th>
                    <th style={{ padding: 12 }}>CA HT</th>
                    <th style={{ padding: 12 }}>TVA</th>
                    <th style={{ padding: 12 }}>CA TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {vatData.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{Number(r.vat_rate).toFixed(0)}%</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{Number(r.revenue_ht).toFixed(3)} TND</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{Number(r.vat_amount).toFixed(3)} TND</td>
                      <td style={{ padding: 12, color: 'var(--text-primary)' }}>{Number(r.revenue_ttc).toFixed(3)} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vatData.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 16 }}>Aucune vente sur la période.</p>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
              Calcul basé sur l'hypothèse prix de vente TTC (convention point de vente).
              Ces chiffres sont indicatifs — à faire valider par un professionnel avant toute déclaration fiscale.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Ventilation par canal</h2>
            <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: 12 }}>Canal</th>
                    <th style={{ padding: 12 }}>Commandes</th>
                    <th style={{ padding: 12 }}>CA brut</th>
                    <th style={{ padding: 12 }}>Remises</th>
                    <th style={{ padding: 12 }}>Commissions</th>
                    <th style={{ padding: 12 }}>CA net</th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{c.channel_label}</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{c.order_count}</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{Number(c.gross).toFixed(3)} TND</td>
                      <td style={{ padding: 12, color: 'var(--danger)' }}>{Number(c.discounts).toFixed(3)} TND</td>
                      <td style={{ padding: 12, color: 'var(--danger)' }}>{Number(c.commissions).toFixed(3)} TND</td>
                      <td style={{ padding: 12, color: 'var(--accent)', fontWeight: 700 }}>{Number(c.net).toFixed(3)} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {channelData.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 16 }}>Aucune vente sur la période.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }}></div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
