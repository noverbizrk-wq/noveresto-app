'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouvelle',
  to_validate: 'À valider',
  accepted: 'Acceptée',
  in_preparation: 'En préparation',
  ready: 'Prête',
  awaiting_courier: 'Attente livreur',
  handed_off: 'Remise',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
  disputed: 'Litige'
};

const STATUS_COLORS: Record<string, string> = {
  new: 'var(--info)',
  to_validate: 'var(--warning)',
  accepted: 'var(--purple)',
  in_preparation: 'var(--warning)',
  ready: 'var(--accent)',
  awaiting_courier: 'var(--purple)',
  handed_off: 'var(--purple)',
  delivered: 'var(--success)',
  completed: 'var(--success)',
  cancelled: 'var(--text-muted)',
  refunded: 'var(--danger)',
  disputed: 'var(--danger)'
};

const NEXT_ACTIONS: Record<string, string[]> = {
  new: ['accepted', 'cancelled'],
  to_validate: ['accepted', 'cancelled'],
  accepted: ['in_preparation', 'cancelled'],
  in_preparation: ['ready', 'cancelled'],
  ready: ['awaiting_courier', 'completed'],
  awaiting_courier: ['handed_off'],
  handed_off: ['delivered'],
  delivered: ['completed']
};

interface Order {
  id: number;
  status: string;
  channel_label: string;
  platform_label: string | null;
  received_at: string;
  gross_amount: string;
  net_amount: string;
}

export default function RestaurantOrdersPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    api.restaurantOrders(token, restaurant.id, statusFilter || undefined)
      .then((json) => setOrders(json.data || []))
      .finally(() => setLoading(false));
  }, [restaurant, token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (orderId: number, newStatus: string) => {
    if (!restaurant || !token) return;
    await api.restaurantOrderStatus(token, orderId, restaurant.id, newStatus);
    load();
  };

  const inp: React.CSSProperties = {
    background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none'
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🛒 <span style={{ color: 'var(--accent)' }}>Commandes</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <select style={inp} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && orders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune commande à afficher.</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>#</th>
              <th style={{ padding: 12 }}>Canal</th>
              <th style={{ padding: 12 }}>Reçue à</th>
              <th style={{ padding: 12 }}>Montant net</th>
              <th style={{ padding: 12 }}>Statut</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: 12, fontWeight: 600, color: 'var(--text-primary)' }}>#{o.id}</td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                  {o.channel_label}{o.platform_label ? ` · ${o.platform_label}` : ''}
                </td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                  {new Date(o.received_at).toLocaleTimeString('fr-FR')}
                </td>
                <td style={{ padding: 12, color: 'var(--text-primary)' }}>{Number(o.net_amount).toFixed(3)} TND</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status]
                  }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(NEXT_ACTIONS[o.status] || []).map((next) => (
                      <button
                        key={next}
                        onClick={() => changeStatus(o.id, next)}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 6,
                          border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer'
                        }}
                      >
                        {STATUS_LABELS[next]}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
