'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

// Leaflet utilise `window` au chargement du module — incompatible avec le
// rendu serveur de Next.js, d'où l'import dynamique avec ssr désactivé.
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-card-alt)', borderRadius: 12 }}>Chargement de la carte...</div> });

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
  contact_name: string | null;
  next_action_date: string | null;
  phone_international: string | null;
}

interface Interaction {
  id: number;
  note: string;
  created_at: string;
}

const STAGES: { key: string; label: string }[] = [
  { key: 'nouveau', label: 'Nouveau' },
  { key: 'contacte', label: 'Contacté' },
  { key: 'qualifie', label: 'Qualifié' },
];

function StageStepper({ status }: { status: string }) {
  if (status === 'rejete') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
        {STAGES.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border-color)' }} />
            {i < STAGES.length - 1 && <div style={{ width: 32, height: 2, background: 'var(--border-color)' }} />}
          </div>
        ))}
        <div style={{ width: 32, height: 2, background: 'var(--danger)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</div>
          Rejeté
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex(s => s.key === status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '8px 0', flexWrap: 'wrap' }}>
      {STAGES.map((s, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'future';
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: state === 'future' ? 'var(--bg-card-alt)' : 'var(--accent)',
                color: state === 'future' ? 'var(--text-muted)' : 'var(--navy)',
                border: `2px solid ${state === 'future' ? 'var(--border-color)' : 'var(--accent)'}`
              }}>
                {state === 'done' ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: state === 'future' ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: state === 'current' ? 700 : 400, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ width: 40, height: 2, background: i < currentIndex ? 'var(--accent)' : 'var(--border-color)', marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
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

const WHATSAPP_TEMPLATES: Record<string, (name: string) => string> = {
  invisible: (name) => `Bonjour, je me permets de vous contacter au sujet de ${name}. J'ai remarqué que votre établissement n'a pas encore de site web ni beaucoup d'avis en ligne — c'est justement ce qu'on aide les restaurants à améliorer avec NoveResto (gestion + présence digitale). Auriez-vous 5 minutes pour en discuter ?`,
  presence_faible: (name) => `Bonjour, je me permets de vous contacter au sujet de ${name}. J'ai vu que votre présence en ligne pourrait être renforcée — c'est justement ce qu'on aide les restaurants à faire avec NoveResto. Auriez-vous 5 minutes pour en discuter ?`,
  etabli: (name) => `Bonjour, je me permets de vous contacter au sujet de ${name}. Nous accompagnons des restaurants comme le vôtre avec NoveResto pour optimiser la gestion au quotidien (stocks, coûts, commandes). Seriez-vous intéressé pour en discuter ?`,
};

function buildWhatsAppLink(prospect: Prospect): string | null {
  if (!prospect.phone_international) return null;
  const digitsOnly = prospect.phone_international.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;
  const template = WHATSAPP_TEMPLATES[prospect.opportunity_tier] || WHATSAPP_TEMPLATES.presence_faible;
  const message = template(prospect.name);
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export default function ProspectionPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [zoneLabel, setZoneLabel] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'map'>('text');
  const [mapPoint, setMapPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);
  const [category, setCategory] = useState('restaurant');
  const [tierFilter, setTierFilter] = useState('');
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<Record<number, Interaction[]>>({});
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [newInteraction, setNewInteraction] = useState('');
  const [contactDraft, setContactDraft] = useState<Record<number, string>>({});
  const [dateDraft, setDateDraft] = useState<Record<number, string>>({});
  const [aiPitch, setAiPitch] = useState<Record<number, string>>({});
  const [aiPitchLoading, setAiPitchLoading] = useState<number | null>(null);
  const [aiPitchError, setAiPitchError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    api.restaurantProspectionList(token, restaurant.id) // toujours non filtré : le filtre est appliqué côté client (voir filteredProspects)
      .then((json) => setProspects(json.data || []))
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const search = async () => {
    if (!restaurant || !token) return;
    if (searchMode === 'text' && !zoneLabel.trim()) return;
    if (searchMode === 'map' && !mapPoint) return;
    setSearching(true);
    setSearchError(null);
    try {
      if (searchMode === 'map' && mapPoint) {
        await api.restaurantProspectionSearchByMap(token, restaurant.id, mapPoint.lat, mapPoint.lng, radiusKm, category);
      } else {
        await api.restaurantProspectionSearch(token, restaurant.id, zoneLabel.trim(), category);
      }
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

  const downloadCsv = async () => {
    if (!restaurant || !token) return;
    const url = api.restaurantProspectionExportCsvUrl(restaurant.id, tierFilter || undefined);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const saveNotes = async (id: number) => {
    if (!restaurant || !token) return;
    await api.restaurantProspectionUpdate(token, id, restaurant.id, { notes: notesDraft[id] || '' });
    load();
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!interactions[id] && restaurant && token) {
      setLoadingInteractions(true);
      try {
        const json = await api.restaurantProspectionInteractions(token, id, restaurant.id);
        setInteractions(prev => ({ ...prev, [id]: json.data || [] }));
      } finally {
        setLoadingInteractions(false);
      }
    }
  };

  const addInteraction = async (id: number) => {
    if (!restaurant || !token || !newInteraction.trim()) return;
    const created = await api.restaurantProspectionAddInteraction(token, id, restaurant.id, newInteraction.trim());
    setInteractions(prev => ({ ...prev, [id]: [created, ...(prev[id] || [])] }));
    setNewInteraction('');
  };

  const saveStructuredFields = async (id: number) => {
    if (!restaurant || !token) return;
    await api.restaurantProspectionUpdate(token, id, restaurant.id, {
      contact_name: contactDraft[id],
      next_action_date: dateDraft[id] || null
    });
    load();
  };

  const generateAiPitch = async (id: number) => {
    if (!restaurant || !token) return;
    setAiPitchLoading(id);
    setAiPitchError(null);
    try {
      const result = await api.restaurantProspectPitch(token, restaurant.id, id);
      setAiPitch(prev => ({ ...prev, [id]: result.message }));
    } catch (e: any) {
      setAiPitchError(e.message || 'La génération a échoué.');
    } finally {
      setAiPitchLoading(null);
    }
  };

  const counts = {
    invisible: prospects.filter(p => p.opportunity_tier === 'invisible').length,
    presence_faible: prospects.filter(p => p.opportunity_tier === 'presence_faible').length,
    etabli: prospects.filter(p => p.opportunity_tier === 'etabli').length,
  };

  // Filtrage purement côté client — `prospects` reste toujours la liste
  // complète (nécessaire pour que les compteurs ci-dessus soient toujours
  // exacts, peu importe le filtre actif à l'affichage).
  const filteredProspects = tierFilter ? prospects.filter(p => p.opportunity_tier === tierFilter) : prospects;

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
        {/* Bascule mode texte / carte */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => setSearchMode('text')}
            style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${searchMode === 'text' ? 'var(--accent)' : 'var(--border-color)'}`, background: searchMode === 'text' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: searchMode === 'text' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            📝 Par nom de zone
          </button>
          <button
            onClick={() => setSearchMode('map')}
            style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${searchMode === 'map' ? 'var(--accent)' : 'var(--border-color)'}`, background: searchMode === 'map' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: searchMode === 'map' ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            🗺️ Sur la carte
          </button>
        </div>

        {searchMode === 'text' ? (
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
        ) : (
          <div>
            <MapPicker radiusKm={radiusKm} selected={mapPoint} onSelect={(lat, lng) => setMapPoint({ lat, lng })} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Rayon : {radiusKm} km
                <input type="range" min={1} max={15} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} style={{ width: 120 }} />
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={search}
                disabled={searching || !mapPoint}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: (searching || !mapPoint) ? 'var(--border-color)' : 'var(--accent)', color: (searching || !mapPoint) ? 'var(--text-muted)' : 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: (searching || !mapPoint) ? 'default' : 'pointer' }}
              >
                {searching ? 'Recherche...' : '🔍 Rechercher ici'}
              </button>
              {!mapPoint && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique sur la carte pour choisir un point de recherche.</span>}
            </div>
          </div>
        )}

        {searchError && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{searchError}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
          Recherche via Google Places — résultats enregistrés automatiquement, relance une recherche pour actualiser.
        </p>
      </div>

      {/* KPIs par palier */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={downloadCsv}
          disabled={prospects.length === 0}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: prospects.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 12, cursor: prospects.length === 0 ? 'default' : 'pointer' }}
        >
          ⬇ Export CSV{tierFilter ? ` (${TIER_LABELS[tierFilter]})` : ''}
        </button>
      </div>

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
      {!loading && filteredProspects.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>
          {prospects.length === 0
            ? 'Aucun prospect. Lance une recherche ci-dessus pour commencer.'
            : 'Aucun prospect dans ce palier.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredProspects.map((p) => {
          const isExpanded = expandedId === p.id;
          return (
          <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `color-mix(in srgb, ${TIER_COLORS[p.opportunity_tier]} 15%, transparent)`, color: TIER_COLORS[p.opportunity_tier] }}>
                    {TIER_LABELS[p.opportunity_tier]}
                  </span>
                  {p.next_action_date && (
                    <span style={{ fontSize: 10, color: 'var(--warning)' }}>📅 Relance {new Date(p.next_action_date).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{p.address}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {p.phone && <span>📞 {p.phone}</span>}
                  {p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>🌐 Site web</a> : <span style={{ color: 'var(--danger)' }}>🚫 Aucun site</span>}
                  {p.rating && <span>⭐ {p.rating} ({p.review_count} avis)</span>}
                  {!p.rating && <span>Aucun avis</span>}
                  {p.contact_name && <span>👤 {p.contact_name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {(() => {
                  const waLink = buildWhatsAppLink(p);
                  return waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--success)', background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      💬 WhatsApp
                    </a>
                  ) : null;
                })()}
                <select
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value)}
                  style={{ ...inp, fontSize: 11, padding: '4px 8px' }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button
                  onClick={() => toggleExpand(p.id)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: isExpanded ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: isExpanded ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                >
                  {isExpanded ? '▲ Réduire' : '▼ Détails'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                {/* Pipeline visuel */}
                <StageStepper status={p.status} />

                {/* Champs structurés */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <input
                    placeholder="Contact / décideur (ex: M. Bel Hadj, gérant)"
                    value={contactDraft[p.id] ?? p.contact_name ?? ''}
                    onChange={(e) => setContactDraft({ ...contactDraft, [p.id]: e.target.value })}
                    style={{ ...inp, flex: 1, minWidth: 200, fontSize: 12 }}
                  />
                  <input
                    type="date"
                    value={dateDraft[p.id] ?? (p.next_action_date ? p.next_action_date.slice(0, 10) : '')}
                    onChange={(e) => setDateDraft({ ...dateDraft, [p.id]: e.target.value })}
                    style={{ ...inp, fontSize: 12 }}
                  />
                  <button
                    onClick={() => saveStructuredFields(p.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                  >
                    Enregistrer
                  </button>
                </div>

                {/* Pitch personnalisé par IA */}
                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={() => generateAiPitch(p.id)}
                    disabled={aiPitchLoading === p.id}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {aiPitchLoading === p.id ? 'Génération...' : '✨ Générer un message personnalisé (IA)'}
                  </button>
                  {aiPitchError && aiPitchLoading === null && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>{aiPitchError}</p>}
                  {aiPitch[p.id] && (
                    <div style={{ marginTop: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{aiPitch[p.id]}</p>
                      {(() => {
                        const digitsOnly = p.phone_international ? p.phone_international.replace(/[^\d]/g, '') : null;
                        if (!digitsOnly) return null;
                        const customLink = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(aiPitch[p.id])}`;
                        return (
                          <a href={customLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, textDecoration: 'none' }}>
                            💬 Envoyer ce message via WhatsApp
                          </a>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Historique d'interactions */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Historique</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      placeholder="Ajouter une interaction (ex: appelé, rendez-vous fixé...)"
                      value={newInteraction}
                      onChange={(e) => setNewInteraction(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addInteraction(p.id); }}
                      style={{ ...inp, flex: 1, fontSize: 12 }}
                    />
                    <button
                      onClick={() => addInteraction(p.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Ajouter
                    </button>
                  </div>
                  {loadingInteractions && !interactions[p.id] && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Chargement...</p>}
                  {interactions[p.id]?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune interaction enregistrée.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {interactions[p.id]?.map((it) => (
                      <div key={it.id} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '6px 10px', background: 'var(--bg-card-alt)', borderRadius: 8 }}>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(it.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{it.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
