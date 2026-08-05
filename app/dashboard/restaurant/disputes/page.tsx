'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface Dispute {
  id: number;
  reason: string;
  platform: string | null;
  amount_requested: string;
  amount_refunded: string;
  status: string;
}

interface DisputesSummary {
  total_disputes: string;
  open_disputes: string;
  total_requested: string;
  total_refunded: string;
  total_gap: string;
}

const STATUS_LABELS: Record<string, string> = {
  to_analyze: 'À analyser', evidence_needed: 'Preuve à compléter', contest_prepared: 'Contestation prête',
  sent: 'Envoyée', pending: 'En attente', accepted: 'Acceptée', partially_accepted: 'Partiellement acceptée',
  refused: 'Refusée', refunded: 'Remboursée', closed: 'Clôturée'
};
const STATUS_COLORS: Record<string, string> = {
  to_analyze: 'var(--text-muted)', evidence_needed: 'var(--warning)', contest_prepared: 'var(--warning)', sent: 'var(--info)',
  pending: 'var(--warning)', accepted: 'var(--accent)', partially_accepted: 'var(--accent)', refused: 'var(--danger)',
  refunded: 'var(--accent)', closed: 'var(--text-muted)'
};
const NEXT_ACTIONS: Record<string, string[]> = {
  to_analyze: ['evidence_needed', 'contest_prepared', 'closed'],
  evidence_needed: ['contest_prepared'],
  contest_prepared: ['sent'],
  sent: ['pending'],
  pending: ['accepted', 'partially_accepted', 'refused'],
  accepted: ['refunded'],
  partially_accepted: ['refunded'],
  refused: ['closed']
};

export default function DisputesPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [summary, setSummary] = useState<DisputesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDispute, setNewDispute] = useState({ reason: '', platform: '', amount_requested: '' });
  const [refundInputs, setRefundInputs] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantDisputes(token, restaurant.id),
      api.restaurantDisputesSummary(token, restaurant.id)
    ])
      .then(([disputesJson, summaryJson]) => {
        setDisputes(disputesJson.data || []);
        setSummary(summaryJson);
      })
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const createDispute = async () => {
    if (!restaurant || !token || !newDispute.reason) return;
    await api.restaurantDisputeCreate(token, restaurant.id, {
      reason: newDispute.reason,
      platform: newDispute.platform || null,
      amount_requested: Number(newDispute.amount_requested) || 0
    });
    setNewDispute({ reason: '', platform: '', amount_requested: '' });
    setShowForm(false);
    load();
  };

  const changeStatus = async (id: number, status: string) => {
    if (!restaurant || !token) return;
    const amountRefunded = status === 'refunded' ? Number(refundInputs[id] || 0) : undefined;
    await api.restaurantDisputeStatus(token, id, restaurant.id, status, amountRefunded);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          ⚖️ Litiges <span style={{ color: 'var(--accent)' }}>et remboursements</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouveau litige
          </button>
        </div>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Litiges ouverts" value={summary.open_disputes} />
          <KpiCard label="Montant demandé" value={`${Number(summary.total_requested).toFixed(3)} TND`} />
          <KpiCard label="Montant remboursé" value={`${Number(summary.total_refunded).toFixed(3)} TND`} />
          <KpiCard label="Écart non récupéré" value={`${Number(summary.total_gap).toFixed(3)} TND`} danger />
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Motif du litige" value={newDispute.reason} onChange={(e) => setNewDispute({ ...newDispute, reason: e.target.value })}
            style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, flex: 1, minWidth: 200 }} />
          <input placeholder="Plateforme" value={newDispute.platform} onChange={(e) => setNewDispute({ ...newDispute, platform: e.target.value })}
            style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 140 }} />
          <input type="number" step="0.001" placeholder="Montant demandé" value={newDispute.amount_requested}
            onChange={(e) => setNewDispute({ ...newDispute, amount_requested: e.target.value })}
            style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 140 }} />
          <button onClick={createDispute} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Créer
          </button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && disputes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucun litige.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {disputes.map((d) => (
          <div key={d.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{d.reason}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {d.platform && `${d.platform} · `}
                  Demandé : {Number(d.amount_requested).toFixed(3)} TND
                  {Number(d.amount_refunded) > 0 && ` · Remboursé : ${Number(d.amount_refunded).toFixed(3)} TND`}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `color-mix(in srgb, ${STATUS_COLORS[d.status]} 20%, transparent)`, color: STATUS_COLORS[d.status] }}>
                {STATUS_LABELS[d.status]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {(NEXT_ACTIONS[d.status] || []).map((next) => (
                <div key={next} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {next === 'refunded' && (
                    <input
                      type="number" step="0.001" placeholder="Montant"
                      value={refundInputs[d.id] || ''}
                      onChange={(e) => setRefundInputs({ ...refundInputs, [d.id]: e.target.value })}
                      style={{ width: 80, background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12 }}
                    />
                  )}
                  <button
                    onClick={() => changeStatus(d.id, next)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer' }}
                  >
                    {STATUS_LABELS[next]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
