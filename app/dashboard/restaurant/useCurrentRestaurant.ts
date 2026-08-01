'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// Convention réelle du projet : token lu depuis le cookie nr_token (pas
// localStorage — cf. app/dashboard/orders/page.tsx pour le pattern exact).
// Le restaurant sélectionné (utile pour les comptes admin) est conservé en
// sessionStorage pour survivre à la navigation entre pages indépendantes.

const STORAGE_KEY = 'nr_selected_restaurant_id';

function readTokenCookie(): string | undefined {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1];
}

interface RestaurantContext {
  id: number;
  name: string;
  currency: string;
  timezone: string;
}

export function useCurrentRestaurant() {
  const [restaurants, setRestaurants] = useState<RestaurantContext[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = readTokenCookie();
    setToken(t);
    if (!t) {
      setError('Session expirée');
      setLoading(false);
      return;
    }

    api.restaurantContext(t)
      .then((json) => {
        const list: RestaurantContext[] = json.data || [];
        setRestaurants(list);

        const stored = Number(sessionStorage.getItem(STORAGE_KEY));
        const storedIsValid = list.some((r) => r.id === stored);

        setSelectedId(storedIsValid ? stored : (list[0]?.id ?? null));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectRestaurant = useCallback((id: number) => {
    setSelectedId(id);
    sessionStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const restaurant = restaurants.find((r) => r.id === selectedId) || null;

  return {
    restaurant,
    restaurants,
    selectRestaurant,
    isMultiRestaurant: restaurants.length > 1,
    token,
    loading,
    error
  };
}
