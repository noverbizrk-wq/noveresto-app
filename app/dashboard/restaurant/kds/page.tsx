'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface KdsItem {
  product_name?: string;
  item_name?: string;
  quantity: number;
  station: string | null;
  is_cancelled: boolean;
}

interface KdsOrder {
  id: number;
  status: string;
  seconds_elapsed: number;
  is_late: boolean;
  items: KdsItem[];
}

const POLL_INTERVAL_MS = 5000;

export default function KdsPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [queue, setQueue] = useState<KdsOrder[]>([]);

  useEffect(() => {
    if (!restaurant || !token) return;
    const fetchQueue = () => {
      api.restaurantKdsQueue(token, restaurant.id)
        .then((json) => setQueue(json.data || []))
        .catch(() => {});
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [restaurant, token]);

  const advance = async (orderId: number, currentStatus: string) => {
    if (!restaurant || !token) return;
    const next = currentStatus === 'accepted' ? 'in_preparation'
      : currentStatus === 'in_preparation' ? 'ready'
      : 'awaiting_courier';
    await api.restaurantOrderStatus(token, orderId, restaurant.id, next);
  };

  return (
    <div style={{ margin: -24, padding: 24, minHeight: 'calc(100vh - 56px)', background: '#050d15' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>🔥 Écran cuisine</h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {queue.map((order) => {
          const elapsedMin = Math.floor(order.seconds_elapsed / 60);
          const borderColor = order.is_late ? '#E84545' : elapsedMin > 10 ? '#F5A623' : '#00C48C';
          const bgColor = order.is_late ? 'rgba(232,69,69,.08)' : elapsedMin > 10 ? 'rgba(245,166,35,.08)' : '#0F2D40';

          return (
            <div key={order.id} style={{ borderRadius: 12, border: `2px solid ${borderColor}`, background: bgColor, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>#{order.id}</span>
                <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 13 }}>
                  {String(elapsedMin).padStart(2, '0')}:{String(order.seconds_elapsed % 60).padStart(2, '0')}
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                {order.items.filter((it) => !it.is_cancelled).map((it, idx) => (
                  <li key={idx} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>
                    <b>{it.quantity}×</b> {it.item_name ?? it.product_name}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => advance(order.id, order.status)}
                style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, background: '#00C48C', color: '#081522', cursor: 'pointer' }}
              >
                {order.status === 'accepted' ? 'Démarrer préparation'
                  : order.status === 'in_preparation' ? 'Marquer prête'
                  : 'Envoyer au livreur'}
              </button>
            </div>
          );
        })}
      </div>

      {queue.length === 0 && <p style={{ color: '#6A8FAB', marginTop: 24 }}>Aucune commande en cours.</p>}
    </div>
  );
}
