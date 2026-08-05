'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface CostSummary {
  menu_item_id: number;
  menu_item_name: string;
  price: number;
  recipe_cost: number;
  food_cost_pct: number;
  margin_unit: number;
  margin_pct: number;
  ingredients: {
    recipe_ingredient_id: number;
    ingredient_id: number;
    name: string;
    unit: string;
    quantity: number;
    unit_cost: number;
    line_cost: number;
  }[];
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  unit_cost: string;
}

function foodCostColor(pct: number) {
  if (pct <= 30) return 'var(--accent)';
  if (pct <= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export default function RecipesPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [costs, setCosts] = useState<CostSummary[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState<{ ingredient_id: string; quantity: string }>({ ingredient_id: '', quantity: '' });

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantCostsSummary(token, restaurant.id),
      api.restaurantIngredients(token, restaurant.id)
    ])
      .then(([costsJson, ingredientsJson]) => {
        setCosts(costsJson.data || []);
        setIngredients(ingredientsJson.data || []);
      })
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const addIngredientToRecipe = async (menuItemId: number) => {
    if (!restaurant || !token || !addForm.ingredient_id || !addForm.quantity) return;
    await api.restaurantRecipeIngredientAdd(
      token, restaurant.id, menuItemId, Number(addForm.ingredient_id), Number(addForm.quantity)
    );
    setAddForm({ ingredient_id: '', quantity: '' });
    load();
  };

  const removeIngredient = async (recipeIngredientId: number) => {
    if (!restaurant || !token) return;
    await api.restaurantRecipeIngredientDelete(token, recipeIngredientId, restaurant.id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🧾 Recettes <span style={{ color: 'var(--accent)' }}>et rentabilité</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && costs.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Aucun article de menu. Créez-en d'abord depuis "Menus et produits".</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {costs.map((c) => (
          <div key={c.menu_item_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedId(expandedId === c.menu_item_id ? null : c.menu_item_id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer' }}
            >
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{c.menu_item_name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Prix de vente : {c.price.toFixed(3)} TND</div>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coût matière</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.recipe_cost.toFixed(3)} TND</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Food cost</div>
                  <div style={{ color: foodCostColor(c.food_cost_pct), fontWeight: 700 }}>{c.food_cost_pct.toFixed(1)}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Marge</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{c.margin_unit.toFixed(3)} TND ({c.margin_pct.toFixed(1)}%)</div>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>{expandedId === c.menu_item_id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedId === c.menu_item_id && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', fontSize: 13, marginTop: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Ingrédient</th>
                      <th style={{ padding: '6px 0' }}>Quantité</th>
                      <th style={{ padding: '6px 0' }}>Coût unitaire</th>
                      <th style={{ padding: '6px 0' }}>Coût ligne</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.ingredients.map((ing) => (
                      <tr key={ing.recipe_ingredient_id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{ing.name}</td>
                        <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{ing.quantity} {ing.unit}</td>
                        <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{ing.unit_cost.toFixed(3)} TND</td>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{ing.line_cost.toFixed(3)} TND</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>
                          <button
                            onClick={() => removeIngredient(ing.recipe_ingredient_id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <select
                    value={addForm.ingredient_id}
                    onChange={(e) => setAddForm({ ...addForm, ingredient_id: e.target.value })}
                    style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="">Ingrédient...</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Quantité"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 100 }}
                  />
                  <button
                    onClick={() => addIngredientToRecipe(c.menu_item_id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
