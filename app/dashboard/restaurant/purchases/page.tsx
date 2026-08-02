'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface PurchaseOrder {
  id: number;
  status: string;
  supplier_name: string | null;
  total_amount: string;
  ordered_at: string | null;
  received_at: string | null;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  unit_cost: string;
}

interface Supplier {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', received: 'Reçue', cancelled: 'Annulée'
};
const STATUS_COLORS: Record<string, string> = {
  draft: '#6A8FAB', sent: '#F5A623', received: '#00C48C', cancelled: '#E84545'
};

export default function PurchasesPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [lines, setLines] = useState<{ ingredient_id: string; quantity: string; unit_price: string }[]>([
    { ingredient_id: '', quantity: '', unit_price: '' }
  ]);
  const [newSupplierName, setNewSupplierName] = useState('');

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantPurchaseOrders(token, restaurant.id),
      api.restaurantIngredients(token, restaurant.id),
      api.restaurantSuppliers(token, restaurant.id)
    ])
      .then(([ordersJson, ingredientsJson, suppliersJson]) => {
        setOrders(ordersJson.data || []);
        setIngredients(ingredientsJson.data || []);
        setSuppliers(suppliersJson.data || []);
      })
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const addLine = () => setLines([...lines, { ingredient_id: '', quantity: '', unit_price: '' }]);
  const updateLine = (idx: number, field: string, value: string) => {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], [field]: value };
    setLines(copy);
  };

  const createOrder = async () => {
    if (!restaurant || !token) return;
    const validLines = lines.filter(l => l.ingredient_id && l.quantity && l.unit_price);
    if (validLines.length === 0) return;
    await api.restaurantPurchaseOrderCreate(
      token, restaurant.id, newSupplierId ? Number(newSupplierId) : null,
      validLines.map(l => ({ ingredient_id: Number(l.ingredient_id), quantity: Number(l.quantity), unit_price: Number(l.unit_price) }))
    );
    setLines([{ ingredient_id: '', quantity: '', unit_price: '' }]);
    setNewSupplierId('');
    setShowNewForm(false);
    load();
  };

  const receiveOrder = async (id: number) => {
    if (!restaurant || !token) return;
    await api.restaurantPurchaseOrderReceive(token, id, restaurant.id);
    load();
  };

  const createSupplier = async () => {
    if (!restaurant || !token || !newSupplierName) return;
    await api.restaurantSupplierCreate(token, restaurant.id, { name: newSupplierName });
    setNewSupplierName('');
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: '#fff' }}>
          🧑‍🍳 Achats <span style={{ color: '#00C48C' }}>et fournisseurs</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #00C48C', background: 'transparent', color: '#00C48C', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouvelle commande
          </button>
        </div>
      </div>

      {/* Fournisseurs rapide */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6A8FAB' }}>Fournisseurs : {suppliers.map(s => s.name).join(', ') || 'aucun'}</span>
        <input
          placeholder="Nouveau fournisseur"
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12, width: 160 }}
        />
        <button onClick={createSupplier} style={{ background: 'transparent', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 10px', color: '#8BAABF', fontSize: 12, cursor: 'pointer' }}>+ Ajouter</button>
      </div>

      {showNewForm && (
        <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <select value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)}
              style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}>
              <option value="">Fournisseur (optionnel)</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={line.ingredient_id} onChange={(e) => updateLine(idx, 'ingredient_id', e.target.value)}
                style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, flex: 1 }}>
                <option value="">Ingrédient...</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input type="number" step="0.001" placeholder="Quantité" value={line.quantity}
                onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 100 }} />
              <input type="number" step="0.001" placeholder="Prix unitaire" value={line.unit_price}
                onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 120 }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addLine} style={{ background: 'transparent', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 14px', color: '#8BAABF', fontSize: 13, cursor: 'pointer' }}>+ Ligne</button>
            <button onClick={createOrder} style={{ background: '#00C48C', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#081522', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Créer la commande</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#6A8FAB' }}>Chargement...</p>}
      {!loading && orders.length === 0 && <p style={{ color: '#6A8FAB' }}>Aucune commande d'achat.</p>}

      <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#081522', color: '#6A8FAB', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>#</th>
              <th style={{ padding: 12 }}>Fournisseur</th>
              <th style={{ padding: 12 }}>Montant</th>
              <th style={{ padding: 12 }}>Statut</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid #1A3A52' }}>
                <td style={{ padding: 12, fontWeight: 600, color: '#fff' }}>#{o.id}</td>
                <td style={{ padding: 12, color: '#8BAABF' }}>{o.supplier_name || '—'}</td>
                <td style={{ padding: 12, color: '#fff' }}>{Number(o.total_amount).toFixed(3)} TND</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {o.status === 'sent' && (
                    <button
                      onClick={() => receiveOrder(o.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #00C48C', color: '#00C48C', background: 'transparent', cursor: 'pointer' }}
                    >
                      Marquer reçue
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
