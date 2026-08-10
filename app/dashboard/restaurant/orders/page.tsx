'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { formatAmount } from '@/lib/currency';
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
  const [teifOpenFor, setTeifOpenFor] = useState<number | null>(null);
  const [teifGenerated, setTeifGenerated] = useState<Record<number, boolean>>({});
  const [teifForm, setTeifForm] = useState({ customer_tax_id: '', customer_name: '', customer_address: '', customer_city: '', customer_postal_code: '' });
  const [teifError, setTeifError] = useState<string | null>(null);
  const [teifSubmitting, setTeifSubmitting] = useState(false);

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

  const openTeifForm = (orderId: number) => {
    setTeifError(null);
    setTeifForm({ customer_tax_id: '', customer_name: '', customer_address: '', customer_city: '', customer_postal_code: '' });
    setTeifOpenFor(teifOpenFor === orderId ? null : orderId);
  };

  const submitTeif = async (orderId: number) => {
    if (!restaurant || !token) return;
    if (!teifForm.customer_tax_id.trim() || !teifForm.customer_name.trim()) {
      setTeifError('Matricule fiscal et nom du client requis.');
      return;
    }
    setTeifSubmitting(true);
    setTeifError(null);
    try {
      await api.restaurantTeifCreate(token, restaurant.id, orderId, teifForm);
      setTeifGenerated(prev => ({ ...prev, [orderId]: true }));
      setTeifOpenFor(null);
    } catch (e: any) {
      setTeifError(e.message || 'La génération a échoué.');
    } finally {
      setTeifSubmitting(false);
    }
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

      <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
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
              <Fragment key={o.id}>
              <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: 12, fontWeight: 600, color: 'var(--text-primary)' }}>#{o.id}</td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                  {o.channel_label}{o.platform_label ? ` · ${o.platform_label}` : ''}
                </td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                  {new Date(o.received_at).toLocaleTimeString('fr-FR')}
                </td>
                <td style={{ padding: 12, color: 'var(--text-primary)' }}>{formatAmount(Number(o.net_amount), restaurant?.currency)}</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: `color-mix(in srgb, ${STATUS_COLORS[o.status]} 20%, transparent)`, color: STATUS_COLORS[o.status]
                  }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                    {teifGenerated[o.id] ? (
                      <a
                        href={restaurant ? api.restaurantTeifDownloadUrl(restaurant.id, o.id) : '#'}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--success)', color: 'var(--success)', textDecoration: 'none' }}
                      >
                        ✓ Télécharger XML
                      </a>
                    ) : (
                      <button
                        onClick={() => openTeifForm(o.id)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}
                      >
                        🧾 Facture TEIF
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {teifOpenFor === o.id && (
                <tr key={`${o.id}-teif`} style={{ background: 'var(--bg-card-alt)' }}>
                  <td colSpan={6} style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Génère une facture TEIF pour un client professionnel (matricule fiscal requis). ⚠️ Document généré uniquement — non signé, non soumis à TTN (nécessite un certificat TUNTRUST à configurer séparément).
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <input placeholder="Matricule fiscal client *" value={teifForm.customer_tax_id} onChange={e => setTeifForm({ ...teifForm, customer_tax_id: e.target.value })} style={{ ...inp, flex: 1, minWidth: 160 }} />
                      <input placeholder="Nom du client *" value={teifForm.customer_name} onChange={e => setTeifForm({ ...teifForm, customer_name: e.target.value })} style={{ ...inp, flex: 1, minWidth: 160 }} />
                      <input placeholder="Adresse" value={teifForm.customer_address} onChange={e => setTeifForm({ ...teifForm, customer_address: e.target.value })} style={{ ...inp, flex: 1, minWidth: 140 }} />
                      <input placeholder="Ville" value={teifForm.customer_city} onChange={e => setTeifForm({ ...teifForm, customer_city: e.target.value })} style={{ ...inp, width: 120 }} />
                      <input placeholder="Code postal" value={teifForm.customer_postal_code} onChange={e => setTeifForm({ ...teifForm, customer_postal_code: e.target.value })} style={{ ...inp, width: 100 }} />
                    </div>
                    {teifError && <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{teifError}</p>}
                    <button
                      onClick={() => submitTeif(o.id)}
                      disabled={teifSubmitting}
                      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      {teifSubmitting ? 'Génération...' : 'Générer la facture'}
                    </button>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
