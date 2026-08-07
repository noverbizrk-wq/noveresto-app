'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface Prospect {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: string | null;
  review_count: number;
  category: string;
  zone_label: string;
  opportunity_tier: 'invisible' | 'presence_faible' | 'etabli';
  status: 'nouveau' | 'contacte' | 'qualifie' | 'rejete';
  notes: string | null;
}

const TIER_LABELS: Record<string, string> = {
  invisible: 'Invisible', presence_faible: 'Présence faible', etabli: 'Établi'
};
const TIER_COLORS: Record<string, string> = {
  invisible: 'var(--danger)', presence_faible: 'var(--warning)', etabli: 'var(--success)'
};
const STATUS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau', contacte: 'Contacté', qualifie: 'Qualifié', rejete: 'Rejeté'
};

const CATEGORIES = ['restaurant', 'café', 'fast food', 'pizzeria', 'boulangerie', 'salon de thé'];

export default function ProspectionPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [zoneLabel, setZoneLabel] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [tierFilter, setTierFilter] = useState('');
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    api.restaurantProspectionList(token, restaurant.id, tierFilter || undefined)
      .then((json) => setProspects(json.data || []))
      .finally(() => setLoading(false));
  }, [restaurant, token, tierFilter]);

  useEffect(() => { load(); }, [load]);

  const search = async () => {
    if (!restaurant || !token || !zoneLabel.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      await api.restaurantProspectionSearch(token, restaurant.id, zoneLabel.trim(), category);
      load();
    } catch (e: any) {
      setSearchError(e.message || 'La recherche a échoué');
    } finally {
      setSearching(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!restaurant || !token) return;
    await api.restaurantProspectionUpdate(token, id, restaurant.id, { status });
    load();
  };

  const saveNotes = async (id: number) => {
    if (!restaurant || !token) return;
    await api.restaurantProspectionUpdate(token, id, restaurant.id, { notes: notesDraft[id] || '' });
    load();
  };

  const counts = {
    invisible: prospects.filter(p => p.opportunity_tier === 'invisible').length,
    presence_faible: prospects.filter(p => p.opportunity_tier === 'presence_faible').length,
    etabli: prospects.filter(p => p.opportunity_tier === 'etabli').length,
  };

  const inp: React.CSSProperties = {
    background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)'
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🎯 Prospection <span style={{ color: 'var(--accent)' }}>commerciale</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {/* Recherche */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Zone (ex: Ariana, Sidi Bouzid...)"
            value={zoneLabel}
            onChange={(e) => setZoneLabel(e.target.value)}
            style={{ ...inp, flex: 1, minWidth: 180 }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={search}
            disabled={searching || !zoneLabel.trim()}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {searching ? 'Recherche...' : '🔍 Rechercher'}
          </button>
        </div>
        {searchError && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{searchError}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
          Recherche via Google Places — résultats enregistrés automatiquement, relance une recherche sur la même zone pour actualiser.
        </p>
      </div>

      {/* KPIs par palier */}
      <div className="nr-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setTierFilter(tierFilter === 'invisible' ? '' : 'invisible')} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: `1px solid ${tierFilter === 'invisible' ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700 }}>Invisible</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{counts.invisible}</div>
        </button>
        <button onClick={() => setTierFilter(tierFilter === 'presence_faible' ? '' : 'presence_faible')} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: `1px solid ${tierFilter === 'presence_faible' ? 'var(--warning)' : 'var(--border-color)'}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--warning)', textTransform: 'uppercase', fontWeight: 700 }}>Présence faible</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{counts.presence_faible}</div>
        </button>
        <button onClick={() => setTierFilter(tierFilter === 'etabli' ? '' : 'etabli')} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: `1px solid ${tierFilter === 'etabli' ? 'var(--success)' : 'var(--border-color)'}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>Établi</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{counts.etabli}</div>
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && prospects.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Aucun prospect. Lance une recherche ci-dessus pour commencer.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {prospects.map((p) => (
          <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `color-mix(in srgb, ${TIER_COLORS[p.opportunity_tier]} 15%, transparent)`, color: TIER_COLORS[p.opportunity_tier] }}>
                    {TIER_LABELS[p.opportunity_tier]}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{p.address}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {p.phone && <span>📞 {p.phone}</span>}
                  {p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>🌐 Site web</a> : <span style={{ color: 'var(--danger)' }}>🚫 Aucun site</span>}
                  {p.rating && <span>⭐ {p.rating} ({p.review_count} avis)</span>}
                  {!p.rating && <span>Aucun avis</span>}
                </div>
              </div>
              <select
                value={p.status}
                onChange={(e) => updateStatus(p.id, e.target.value)}
                style={{ ...inp, fontSize: 11, padding: '4px 8px' }}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                placeholder="Note (ex: appelé le..., rendez-vous fixé...)"
                value={notesDraft[p.id] ?? p.notes ?? ''}
                onChange={(e) => setNotesDraft({ ...notesDraft, [p.id]: e.target.value })}
                style={{ ...inp, flex: 1, fontSize: 12 }}
              />
              <button
                onClick={() => saveNotes(p.id)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
