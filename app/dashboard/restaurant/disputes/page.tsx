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
  to_analyze: '#6A8FAB', evidence_needed: '#F5A623', contest_prepared: '#F5A623', sent: '#3B82F6',
  pending: '#F5A623', accepted: '#00C48C', partially_accepted: '#00C48C', refused: '#E84545',
  refunded: '#00C48C', closed: '#6A8FAB'
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
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: '#fff' }}>
          ⚖️ Litiges <span style={{ color: '#00C48C' }}>et remboursements</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #00C48C', background: 'transparent', color: '#00C48C', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
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
        <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Motif du litige" value={newDispute.reason} onChange={(e) => setNewDispute({ ...newDispute, reason: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, flex: 1, minWidth: 200 }} />
          <input placeholder="Plateforme" value={newDispute.platform} onChange={(e) => setNewDispute({ ...newDispute, platform: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 140 }} />
          <input type="number" step="0.001" placeholder="Montant demandé" value={newDispute.amount_requested}
            onChange={(e) => setNewDispute({ ...newDispute, amount_requested: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 140 }} />
          <button onClick={createDispute} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#00C48C', color: '#081522', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Créer
          </button>
        </div>
      )}

      {loading && <p style={{ color: '#6A8FAB' }}>Chargement...</p>}
      {!loading && disputes.length === 0 && <p style={{ color: '#6A8FAB' }}>Aucun litige.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {disputes.map((d) => (
          <div key={d.id} style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700 }}>{d.reason}</div>
                <div style={{ color: '#8BAABF', fontSize: 12 }}>
                  {d.platform && `${d.platform} · `}
                  Demandé : {Number(d.amount_requested).toFixed(3)} TND
                  {Number(d.amount_refunded) > 0 && ` · Remboursé : ${Number(d.amount_refunded).toFixed(3)} TND`}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[d.status]}20`, color: STATUS_COLORS[d.status] }}>
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
                      style={{ width: 80, background: '#081522', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12 }}
                    />
                  )}
                  <button
                    onClick={() => changeStatus(d.id, next)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #00C48C', color: '#00C48C', background: 'transparent', cursor: 'pointer' }}
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
    <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, color: '#6A8FAB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: danger ? '#E84545' : '#fff' }}>{value}</div>
    </div>
  );
}
