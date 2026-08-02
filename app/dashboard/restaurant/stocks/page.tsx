'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_stock: string;
  min_stock: string;
  unit_cost: string;
  supplier_name: string | null;
}

export default function StocksPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStockIds, setLowStockIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', current_stock: '0', min_stock: '0', unit_cost: '0' });

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantIngredients(token, restaurant.id),
      api.restaurantLowStockAlerts(token, restaurant.id)
    ])
      .then(([ingredientsJson, alertsJson]) => {
        setIngredients(ingredientsJson.data || []);
        setLowStockIds(new Set((alertsJson.data || []).map((a: Ingredient) => a.id)));
      })
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const submitAdjustment = async (ingredientId: number) => {
    if (!restaurant || !token || !adjustValue) return;
    await api.restaurantStockAdjust(token, restaurant.id, ingredientId, Number(adjustValue), 'Ajustement manuel');
    setAdjusting(null);
    setAdjustValue('');
    load();
  };

  const createIngredient = async () => {
    if (!restaurant || !token || !newIngredient.name) return;
    await api.restaurantIngredientCreate(token, restaurant.id, {
      name: newIngredient.name,
      unit: newIngredient.unit,
      current_stock: Number(newIngredient.current_stock),
      min_stock: Number(newIngredient.min_stock),
      unit_cost: Number(newIngredient.unit_cost)
    });
    setNewIngredient({ name: '', unit: 'kg', current_stock: '0', min_stock: '0', unit_cost: '0' });
    setShowNewForm(false);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: '#fff' }}>
          📦 Stocks <span style={{ color: '#00C48C' }}>et inventaire</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #00C48C', background: 'transparent', color: '#00C48C', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouvel ingrédient
          </button>
        </div>
      </div>

      {showNewForm && (
        <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Nom" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, flex: 1, minWidth: 140 }} />
          <select value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
            <option value="unite">unité</option>
          </select>
          <input type="number" step="0.001" placeholder="Stock initial" value={newIngredient.current_stock}
            onChange={(e) => setNewIngredient({ ...newIngredient, current_stock: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 120 }} />
          <input type="number" step="0.001" placeholder="Seuil alerte" value={newIngredient.min_stock}
            onChange={(e) => setNewIngredient({ ...newIngredient, min_stock: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 120 }} />
          <input type="number" step="0.001" placeholder="Prix unitaire" value={newIngredient.unit_cost}
            onChange={(e) => setNewIngredient({ ...newIngredient, unit_cost: e.target.value })}
            style={{ background: '#081522', border: '1px solid #1A3A52', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, width: 120 }} />
          <button onClick={createIngredient}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#00C48C', color: '#081522', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Créer
          </button>
        </div>
      )}

      {loading && <p style={{ color: '#6A8FAB' }}>Chargement...</p>}

      <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#081522', color: '#6A8FAB', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Ingrédient</th>
              <th style={{ padding: 12 }}>Stock actuel</th>
              <th style={{ padding: 12 }}>Seuil alerte</th>
              <th style={{ padding: 12 }}>Prix unitaire</th>
              <th style={{ padding: 12 }}>Fournisseur</th>
              <th style={{ padding: 12 }}>Ajuster</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const isLow = lowStockIds.has(ing.id);
              return (
                <tr key={ing.id} style={{ borderTop: '1px solid #1A3A52', background: isLow ? 'rgba(232,69,69,.06)' : 'transparent' }}>
                  <td style={{ padding: 12, color: '#fff', fontWeight: 600 }}>
                    {ing.name}
                    {isLow && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(232,69,69,.15)', color: '#E84545' }}>STOCK FAIBLE</span>}
                  </td>
                  <td style={{ padding: 12, color: isLow ? '#E84545' : '#fff' }}>{Number(ing.current_stock).toFixed(3)} {ing.unit}</td>
                  <td style={{ padding: 12, color: '#8BAABF' }}>{Number(ing.min_stock).toFixed(3)} {ing.unit}</td>
                  <td style={{ padding: 12, color: '#8BAABF' }}>{Number(ing.unit_cost).toFixed(3)} TND</td>
                  <td style={{ padding: 12, color: '#8BAABF' }}>{ing.supplier_name || '—'}</td>
                  <td style={{ padding: 12 }}>
                    {adjusting === ing.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="number" step="0.001" autoFocus
                          value={adjustValue}
                          onChange={(e) => setAdjustValue(e.target.value)}
                          placeholder="+/- qté"
                          style={{ width: 80, background: '#081522', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12 }}
                        />
                        <button onClick={() => submitAdjustment(ing.id)} style={{ background: '#00C48C', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#081522', fontSize: 12, cursor: 'pointer' }}>OK</button>
                        <button onClick={() => setAdjusting(null)} style={{ background: 'transparent', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 8px', color: '#8BAABF', fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdjusting(ing.id); setAdjustValue(''); }}
                        style={{ background: 'transparent', border: '1px solid #1A3A52', borderRadius: 6, padding: '4px 10px', color: '#8BAABF', fontSize: 12, cursor: 'pointer' }}
                      >
                        Corriger
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && ingredients.length === 0 && (
        <p style={{ color: '#6A8FAB', marginTop: 16 }}>Aucun ingrédient. Créez-en un avec le bouton ci-dessus.</p>
      )}
    </div>
  );
}
