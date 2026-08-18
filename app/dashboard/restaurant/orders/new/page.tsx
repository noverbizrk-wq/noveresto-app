'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../../useCurrentRestaurant';
import { formatAmount } from '@/lib/currency';

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category_name: string | null;
  is_available: boolean;
}

interface Channel {
  id: number;
  code: string;
  label: string;
}

interface CartLine {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { restaurant, token } = useCurrentRestaurant();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const [channelId, setChannelId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ id: number; total: number } | null>(null);

  useEffect(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantMenuItems(token, restaurant.id),
      api.restaurantChannels(token),
    ])
      .then(([itemsJson, channelsJson]) => {
        const items = (itemsJson.data || []).filter((i: MenuItem) => i.is_available);
        setMenuItems(items);
        const chans = channelsJson.data || [];
        setChannels(chans);
        if (chans.length > 0) setChannelId(chans[0].id);
      })
      .finally(() => setLoading(false));
  }, [restaurant?.id, token]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id);
      if (existing) {
        return prev.map((l) => l.menu_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) => prev
      .map((l) => l.menu_item_id === menuItemId ? { ...l, quantity: l.quantity + delta } : l)
      .filter((l) => l.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((l) => l.menu_item_id !== menuItemId));
  };

  const total = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const categories = Array.from(new Set(menuItems.map((i) => i.category_name || 'Autres')));

  const submitOrder = async () => {
    if (!restaurant || !token || !channelId || cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const order = await api.restaurantOrderCreate(token, restaurant.id, {
        channel_id: channelId,
        customer_phone: customerPhone.trim() || undefined,
        customer_name: customerName.trim() || undefined,
        items: cart.map((l) => ({
          menu_item_id: l.menu_item_id,
          item_name: l.name,
          quantity: l.quantity,
          unit_price: l.price,
        })),
      });
      setSuccess({ id: order.id, total: Number(order.gross_amount) });
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', padding: 24 }}>Chargement...</p>;
  }

  if (success) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'serif', marginBottom: 8 }}>
          Commande #{success.id} créée
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Total : {formatAmount(success.total, restaurant?.currency)}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            onClick={() => setSuccess(null)}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            Nouvelle commande
          </button>
          <button
            onClick={() => router.push('/dashboard/restaurant/orders')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, maxWidth: 1200 }}>
      {/* Menu */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
            🛒 <span style={{ color: 'var(--accent)' }}>Nouvelle commande</span>
          </h1>
          <select
            value={channelId ?? ''}
            onChange={(e) => setChannelId(Number(e.target.value))}
            style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
          >
            {channels.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {menuItems.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Aucun article disponible au menu.</p>
        )}

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{cat}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {menuItems.filter((i) => (i.category_name || 'Autres') === cat).map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{ textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{formatAmount(Number(item.price), restaurant?.currency)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Panier */}
      <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Panier</div>

          {cart.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cliquez sur un article pour l'ajouter.</p>}

          {cart.map((l) => (
            <div key={l.menu_item_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatAmount(l.price, restaurant?.currency)} × {l.quantity}</div>
              </div>
              <button onClick={() => updateQuantity(l.menu_item_id, -1)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>−</button>
              <span style={{ fontSize: 12, minWidth: 16, textAlign: 'center' }}>{l.quantity}</span>
              <button onClick={() => updateQuantity(l.menu_item_id, 1)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>+</button>
              <button onClick={() => removeFromCart(l.menu_item_id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>✕</button>
            </div>
          ))}

          {cart.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 14, fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>{formatAmount(total, restaurant?.currency)}</span>
            </div>
          )}

          {/* Fidelisation : rattachement optionnel a un client */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              ♥ Client fidélité (optionnel)
            </div>
            <input
              placeholder="Téléphone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }}
            />
            <input
              placeholder="Nom (optionnel)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 10 }}>{error}</div>}

          <button
            onClick={submitOrder}
            disabled={cart.length === 0 || !channelId || submitting}
            style={{
              width: '100%', marginTop: 14, padding: '12px', borderRadius: 8, border: 'none',
              background: cart.length === 0 ? 'var(--border-color)' : 'var(--accent)',
              color: cart.length === 0 ? 'var(--text-muted)' : 'var(--navy)',
              fontWeight: 700, fontSize: 14, cursor: cart.length === 0 ? 'default' : 'pointer'
            }}
          >
            {submitting ? 'Création...' : 'Créer la commande'}
          </button>
        </div>
      </div>
    </div>
  );
}
