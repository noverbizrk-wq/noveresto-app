'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../restaurant/useCurrentRestaurant';
import { RestaurantSelector } from '../restaurant/RestaurantSelector';

const C = { navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)', teal:'var(--accent)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)' }

function Section({ icon, title, subtitle, children, open, onToggle }: { icon: string; title: string; subtitle?: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <button onClick={onToggle} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, fontFamily: 'Inter,sans-serif' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{icon} {title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: 11, color: C.muted, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s' }}>▼</span>
      </button>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();

  const [openSections, setOpenSections] = useState({ google: true, deliveroo: false, glovo: false, tax: false });
  const toggle = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  // ---- Google Business Profile ----
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<any>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [googleBanner, setGoogleBanner] = useState<string | null>(null);

  const loadGoogleConnection = useCallback(async () => {
    if (!token || !restaurant) return;
    try {
      const [cfg, status] = await Promise.all([
        api.reputationGoogleConfig(token),
        api.reputationGoogleStatus(token, restaurant.id),
      ]);
      setGoogleConfigured(cfg.configured);
      setGoogleStatus(status);
    } catch (e) {}
  }, [token, restaurant]);

  useEffect(() => { loadGoogleConnection(); }, [loadGoogleConnection]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('google_connect');
    if (result === 'success') {
      setGoogleBanner('✅ Compte Google Business Profile connecté — les avis Google non critiques reçoivent désormais une réponse automatique publiée en direct.');
      loadGoogleConnection();
    } else if (result === 'error') {
      setGoogleBanner(`⚠️ Connexion Google échouée (${params.get('reason') || 'raison inconnue'}).`);
    }
    if (result) window.history.replaceState({}, '', window.location.pathname);
  }, [loadGoogleConnection]);

  const connectGoogle = async () => {
    if (!token || !restaurant) return;
    setConnectingGoogle(true);
    try {
      const d = await api.reputationGoogleConnect(token, restaurant.id);
      if (d.redirect_url) window.location.href = d.redirect_url;
      else setGoogleBanner(`⚠️ ${d.error || 'Connexion impossible'}`);
    } catch (e: any) {
      setGoogleBanner(`⚠️ ${e.message || 'Connexion impossible'}`);
    } finally {
      setConnectingGoogle(false);
    }
  };

  const disconnectGoogle = async () => {
    if (!token || !restaurant) return;
    if (!confirm('Déconnecter le compte Google Business Profile ? La réponse automatique sur Google sera désactivée.')) return;
    await api.reputationGoogleDisconnect(token, restaurant.id);
    loadGoogleConnection();
  };

  // ---- Deliveroo ----
  const [deliverooConn, setDeliverooConn] = useState<{ external_site_id: string | null; status: string; has_webhook_secret: boolean; last_order_at: string | null } | null>(null);
  const [deliverooForm, setDeliverooForm] = useState({ external_site_id: '', webhook_secret: '' });
  const [deliverooSaving, setDeliverooSaving] = useState(false);
  const [deliverooSaved, setDeliverooSaved] = useState(false);

  // ---- Glovo ----
  const [glovoConn, setGlovoConn] = useState<{ external_site_id: string | null; status: string; has_webhook_secret: boolean; last_order_at: string | null } | null>(null);
  const [glovoForm, setGlovoForm] = useState({ external_site_id: '', webhook_secret: '' });
  const [glovoSaving, setGlovoSaving] = useState(false);
  const [glovoSaved, setGlovoSaved] = useState(false);

  useEffect(() => {
    if (!restaurant || !token) return;
    api.restaurantDeliverooConnection(token, restaurant.id).then(setDeliverooConn).catch(() => {});
    api.restaurantGlovoConnection(token, restaurant.id).then(setGlovoConn).catch(() => {});
  }, [restaurant, token]);

  const saveDeliverooConnection = async () => {
    if (!restaurant || !token) return;
    setDeliverooSaving(true);
    try {
      const updated = await api.restaurantDeliverooConnectionUpdate(token, restaurant.id, {
        external_site_id: deliverooForm.external_site_id || undefined,
        webhook_secret: deliverooForm.webhook_secret || undefined,
        status: 'sandbox',
      });
      setDeliverooConn({ external_site_id: updated.external_site_id, status: updated.status, has_webhook_secret: !!deliverooForm.webhook_secret, last_order_at: updated.last_order_at });
      setDeliverooSaved(true);
      setDeliverooForm({ external_site_id: '', webhook_secret: '' });
      setTimeout(() => setDeliverooSaved(false), 2000);
    } finally {
      setDeliverooSaving(false);
    }
  };

  const saveGlovoConnection = async () => {
    if (!restaurant || !token) return;
    setGlovoSaving(true);
    try {
      const updated = await api.restaurantGlovoConnectionUpdate(token, restaurant.id, {
        external_site_id: glovoForm.external_site_id || undefined,
        webhook_secret: glovoForm.webhook_secret || undefined,
        status: 'sandbox',
      });
      setGlovoConn({ external_site_id: updated.external_site_id, status: updated.status, has_webhook_secret: !!glovoForm.webhook_secret, last_order_at: updated.last_order_at });
      setGlovoSaved(true);
      setGlovoForm({ external_site_id: '', webhook_secret: '' });
      setTimeout(() => setGlovoSaved(false), 2000);
    } finally {
      setGlovoSaving(false);
    }
  };

  // ---- Profil fiscal (TEIF / factures) ----
  const [taxProfile, setTaxProfile] = useState({ tax_id: '', address: '', city: '', postal_code: '' });
  const [taxProfileSaving, setTaxProfileSaving] = useState(false);
  const [taxProfileSaved, setTaxProfileSaved] = useState(false);

  const saveTaxProfile = async () => {
    if (!restaurant || !token) return;
    setTaxProfileSaving(true);
    try {
      await api.restaurantTaxProfileUpdate(token, restaurant.id, taxProfile);
      setTaxProfileSaved(true);
      setTimeout(() => setTaxProfileSaved(false), 2000);
    } finally {
      setTaxProfileSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    background: 'var(--bg-card-alt)', border: `1px solid ${C.navyL}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' as any
  };
  const btn = (bg: string, color: string): React.CSSProperties => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' });

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)', marginBottom: 4 }}>
            ⚙️ <span style={{ color: C.teal }}>Paramètres</span> & connexions
          </h1>
          <div style={{ fontSize: 13, color: C.muted }}>Toute la configuration technique du restaurant, au même endroit — séparée des écrans de travail au quotidien.</div>
        </div>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {googleBanner && (
        <div style={{ background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: C.gray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{googleBanner}</span>
          <button onClick={() => setGoogleBanner(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Google Business Profile — reponse automatique aux avis */}
      {googleConfigured && (
        <Section icon="🔍" title="Google Business Profile" subtitle="Réponse automatique aux avis Google Maps" open={openSections.google} onToggle={() => toggle('google')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: C.gray, maxWidth: 480 }}>
              {googleStatus?.connected
                ? <>Connecté{googleStatus.connection?.location_title ? ` · ${googleStatus.connection.location_title}` : ''} — les avis Google non critiques reçoivent une réponse automatique publiée en direct sur Google Maps.</>
                : "Non connecté — les réponses générées par l'IA restent enregistrées dans NoveResto sans être publiées sur Google Maps."}
            </div>
            {googleStatus?.connected ? (
              <button onClick={disconnectGoogle} style={btn('transparent', C.red)}>Déconnecter</button>
            ) : (
              <button onClick={connectGoogle} disabled={connectingGoogle} style={btn(C.teal, C.navyD)}>
                {connectingGoogle ? '⟳...' : '🔗 Connecter Google'}
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Deliveroo */}
      <Section icon="🛵" title="Connexion Deliveroo" subtitle="Réception automatique des commandes" open={openSections.deliveroo} onToggle={() => toggle('deliveroo')}>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          ⚠️ Nécessite un compte développeur Deliveroo (developers.deliveroo.com) — renseignez ici l'identifiant de site et le secret webhook obtenus après inscription. URL de webhook à configurer côté Deliveroo : <code>https://noveresto.app/api/v1/webhooks/deliveroo/orders</code>.
        </p>
        {deliverooConn && (
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 10, padding: 10, background: 'var(--bg-card-alt)', borderRadius: 8 }}>
            Statut actuel : <strong>{deliverooConn.status}</strong>
            {deliverooConn.external_site_id && ` · Site: ${deliverooConn.external_site_id}`}
            {deliverooConn.has_webhook_secret ? ' · Secret configuré ✓' : ' · Secret non configuré'}
            {deliverooConn.last_order_at && ` · Dernière commande reçue: ${new Date(deliverooConn.last_order_at).toLocaleString('fr-FR')}`}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <input placeholder="Identifiant de site Deliveroo" value={deliverooForm.external_site_id} onChange={e => setDeliverooForm({ ...deliverooForm, external_site_id: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} />
          <input placeholder="Secret webhook" type="password" value={deliverooForm.webhook_secret} onChange={e => setDeliverooForm({ ...deliverooForm, webhook_secret: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} />
        </div>
        <button onClick={saveDeliverooConnection} disabled={deliverooSaving} style={btn(deliverooSaved ? 'var(--success)' : C.teal, C.navyD)}>
          {deliverooSaving ? '...' : deliverooSaved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </Section>

      {/* Glovo */}
      <Section icon="🛵" title="Connexion Glovo" subtitle="Réception automatique des commandes" open={openSections.glovo} onToggle={() => toggle('glovo')}>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          ⚠️ Nécessite un compte partenaire Glovo validé (qcommerce-integrations.glovoapp.com) — pas en libre-service, un accord doit être signé avec leur équipe d'intégration avant de recevoir vos identifiants. URL de webhook à fournir à Glovo : <code>https://noveresto.app/api/v1/webhooks/glovo/orders</code>. ⚠️ L'envoi des statuts de préparation vers Glovo n'est pas encore implémenté — commandes reçues correctement, confirmation de préparation à compléter séparément.
        </p>
        {glovoConn && (
          <div style={{ fontSize: 12, color: C.gray, marginBottom: 10, padding: 10, background: 'var(--bg-card-alt)', borderRadius: 8 }}>
            Statut actuel : <strong>{glovoConn.status}</strong>
            {glovoConn.external_site_id && ` · Magasin: ${glovoConn.external_site_id}`}
            {glovoConn.has_webhook_secret ? ' · Jeton configuré ✓' : ' · Jeton non configuré'}
            {glovoConn.last_order_at && ` · Dernière commande reçue: ${new Date(glovoConn.last_order_at).toLocaleString('fr-FR')}`}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <input placeholder="Identifiant de magasin Glovo" value={glovoForm.external_site_id} onChange={e => setGlovoForm({ ...glovoForm, external_site_id: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} />
          <input placeholder="Jeton webhook" type="password" value={glovoForm.webhook_secret} onChange={e => setGlovoForm({ ...glovoForm, webhook_secret: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} />
        </div>
        <button onClick={saveGlovoConnection} disabled={glovoSaving} style={btn(glovoSaved ? 'var(--success)' : C.teal, C.navyD)}>
          {glovoSaving ? '...' : glovoSaved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </Section>

      {/* Profil fiscal — TEIF / factures */}
      <Section icon="🧾" title="Profil fiscal" subtitle="Nécessaire pour générer des factures (TEIF ou PDF)" open={openSections.tax} onToggle={() => toggle('tax')}>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          Renseignez ces coordonnées pour pouvoir générer des factures. ⚠️ Pour la Tunisie (TEIF), ceci ne remplace pas la signature électronique ni la soumission réelle à TTN.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <input placeholder="Matricule fiscal / identifiant fiscal" value={taxProfile.tax_id} onChange={e => setTaxProfile({ ...taxProfile, tax_id: e.target.value })} style={{ ...inp, flex: 1, minWidth: 200 }} />
          <input placeholder="Adresse" value={taxProfile.address} onChange={e => setTaxProfile({ ...taxProfile, address: e.target.value })} style={{ ...inp, flex: 1, minWidth: 160 }} />
          <input placeholder="Ville" value={taxProfile.city} onChange={e => setTaxProfile({ ...taxProfile, city: e.target.value })} style={{ ...inp, width: 130 }} />
          <input placeholder="Code postal" value={taxProfile.postal_code} onChange={e => setTaxProfile({ ...taxProfile, postal_code: e.target.value })} style={{ ...inp, width: 110 }} />
        </div>
        <button onClick={saveTaxProfile} disabled={taxProfileSaving} style={btn(taxProfileSaved ? 'var(--success)' : C.teal, C.navyD)}>
          {taxProfileSaving ? '...' : taxProfileSaved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </Section>
    </div>
  );
}
