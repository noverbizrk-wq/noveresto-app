'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { formatAmount } from '@/lib/currency';
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

interface PurchaseSuggestion {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  suggested_quantity: string;
  unit: string;
  supplier_name: string | null;
  calculation_basis: {
    forecastedNeed: number;
    safetyStock: number;
    currentStock: number;
    pendingOrders: number;
    leadTimeDays: number;
  };
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', received: 'Reçue', cancelled: 'Annulée'
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)', sent: 'var(--warning)', received: 'var(--accent)', cancelled: 'var(--danger)'
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
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expandedBasis, setExpandedBasis] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantPurchaseOrders(token, restaurant.id),
      api.restaurantIngredients(token, restaurant.id),
      api.restaurantSuppliers(token, restaurant.id),
      api.restaurantPurchaseSuggestions(token, restaurant.id, 'pending')
    ])
      .then(([ordersJson, ingredientsJson, suppliersJson, suggestionsJson]) => {
        setOrders(ordersJson.data || []);
        setIngredients(ingredientsJson.data || []);
        setSuppliers(suppliersJson.data || []);
        setSuggestions(suggestionsJson.data || []);
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

  const generateSuggestions = async () => {
    if (!restaurant || !token) return;
    setGenerating(true);
    try {
      await api.restaurantIngredientForecastsGenerate(token, restaurant.id, 14);
      await api.restaurantPurchaseSuggestionsGenerate(token, restaurant.id);
      load();
    } finally {
      setGenerating(false);
    }
  };

  const validateSuggestion = async (s: PurchaseSuggestion) => {
    if (!restaurant || !token) return;
    await api.restaurantPurchaseSuggestionValidate(token, s.id, restaurant.id);
    load();
  };

  const rejectSuggestion = async (s: PurchaseSuggestion) => {
    if (!restaurant || !token) return;
    await api.restaurantPurchaseSuggestionReject(token, s.id, restaurant.id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🧑‍🍳 Achats <span style={{ color: 'var(--accent)' }}>et fournisseurs</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouvelle commande
          </button>
        </div>
      </div>

      {/* Suggestions de commande automatiques */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: suggestions.length ? 12 : 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Suggestions de commande <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(generees a partir des previsions)</span>
          </h2>
          <button
            onClick={generateSuggestions}
            disabled={generating}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: generating ? 'default' : 'pointer', opacity: generating ? 0.6 : 1 }}
          >
            {generating ? 'Calcul en cours...' : 'Recalculer'}
          </button>
        </div>

        {suggestions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune suggestion en attente. Cliquez sur "Recalculer" pour en generer.</p>
        )}

        {suggestions.map((s) => (
          <div key={s.id} style={{ borderTop: '1px solid var(--border-color)', padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{s.ingredient_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {s.suggested_quantity} {s.unit} · {s.supplier_name || 'sans fournisseur'}
                </div>
                <button
                  onClick={() => setExpandedBasis(expandedBasis === s.id ? null : s.id)}
                  style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 4 }}
                >
                  {expandedBasis === s.id ? 'Masquer le detail' : 'Voir le detail du calcul'}
                </button>
                {expandedBasis === s.id && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card-alt)', borderRadius: 6, padding: 8, marginTop: 6 }}>
                    <div>Besoin previsionnel : {s.calculation_basis.forecastedNeed} {s.unit}</div>
                    <div>Stock de securite : {s.calculation_basis.safetyStock} {s.unit}</div>
                    <div>Stock actuel : {s.calculation_basis.currentStock} {s.unit}</div>
                    <div>Commandes en cours : {s.calculation_basis.pendingOrders} {s.unit}</div>
                    <div>Delai fournisseur : {s.calculation_basis.leadTimeDays} j</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => rejectSuggestion(s)}
                  style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }}
                >
                  Rejeter
                </button>
                <button
                  onClick={() => validateSuggestion(s)}
                  style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Valider la commande
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fournisseurs rapide */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fournisseurs : {suppliers.map(s => s.name).join(', ') || 'aucun'}</span>
        <input
          placeholder="Nouveau fournisseur"
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12, width: 160 }}
        />
        <button onClick={createSupplier} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>+ Ajouter</button>
      </div>

      {showNewForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <select value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="">Fournisseur (optionnel)</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={line.ingredient_id} onChange={(e) => updateLine(idx, 'ingredient_id', e.target.value)}
                style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>
                <option value="">Ingrédient...</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input type="number" step="0.001" placeholder="Quantité" value={line.quantity}
                onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 100 }} />
              <input type="number" step="0.001" placeholder="Prix unitaire" value={line.unit_price}
                onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 120 }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addLine} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>+ Ligne</button>
            <button onClick={createOrder} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 16px', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Créer la commande</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && orders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune commande d'achat.</p>}

      <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>#</th>
              <th style={{ padding: 12 }}>Fournisseur</th>
              <th style={{ padding: 12 }}>Montant</th>
              <th style={{ padding: 12 }}>Statut</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: 12, fontWeight: 600, color: 'var(--text-primary)' }}>#{o.id}</td>
                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{o.supplier_name || '—'}</td>
                <td style={{ padding: 12, color: 'var(--text-primary)' }}>{formatAmount(Number(o.total_amount), restaurant?.currency)}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `color-mix(in srgb, ${STATUS_COLORS[o.status]} 20%, transparent)`, color: STATUS_COLORS[o.status] }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {o.status === 'sent' && (
                    <button
                      onClick={() => receiveOrder(o.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer' }}
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
