'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface MenuItem {
  id: number;
  name: string;
  price: string;
  is_available: boolean;
  category_name: string | null;
}

export default function MenusPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    api.restaurantMenuItems(token, restaurant.id)
      .then((json) => setItems(json.data || []))
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const toggleAvailability = async (id: number, current: boolean) => {
    if (!restaurant || !token) return;
    await api.restaurantMenuItemAvailability(token, id, restaurant.id, !current);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🍔 Menus <span style={{ color: 'var(--accent)' }}>et produits</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && items.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Aucun article. Ajoutez votre premier article via l'API.</p>
      )}

      <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Article</th>
              <th style={{ padding: 12 }}>Catégorie</th>
              <th style={{ padding: 12 }}>Prix</th>
              <th style={{ padding: 12 }}>Disponibilité</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{p.category_name || '—'}</td>
                <td style={{ padding: 12, color: 'var(--text-primary)' }}>{Number(p.price).toFixed(3)} TND</td>
                <td style={{ padding: 12 }}>
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available)}
                    style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: p.is_available ? 'rgba(0,196,140,.15)' : 'rgba(232,69,69,.15)',
                      color: p.is_available ? 'var(--accent)' : 'var(--danger)'
                    }}
                  >
                    {p.is_available ? 'Disponible' : 'Rupture'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
