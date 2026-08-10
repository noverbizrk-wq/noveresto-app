'use client';

import { useState, useEffect } from 'react';

// ⚠️ TARIFS PROPOSÉS, PAS VALIDÉS — à ajuster avant mise en ligne réelle.
// Fiabilité inégale selon le pays :
// - Tunisie : dans la continuité de la structure à 3 formules déjà
//   documentée pour le module Social Media IA (39/79/149 TND/mois).
// - France : positionné dans la fourchette réelle des concurrents
//   identifiés dans l'étude de marché (L'Addition 39-89€, Zelty 70-150€,
//   Lightspeed 69-89€/mois) — pas une conversion de change naïve.
// - Maroc : ancré sur de vraies données concurrentes trouvées dans
//   l'étude de marché (QuickCom/Odoo POS locaux à 299-990 DH/mois).
// - Algérie, Sénégal, Côte d'Ivoire, UAE, Belgique : AUCUNE donnée
//   concurrente réelle trouvée pour ces marchés — extrapolation la
//   moins mauvaise possible (Belgique = mêmes prix que France, zone euro
//   comparable ; les autres = proportion approximative), à valider en
//   priorité avant toute communication publique sur ces pays.
type Region = 'tunisie' | 'france' | 'maroc' | 'algerie' | 'senegal' | 'cote_ivoire' | 'uae' | 'belgique';

const BASE_FEATURES = {
  essentielle: ['Commandes et écran cuisine', 'Stocks et achats', 'Personnel et planning', 'Réputation en ligne'],
  croissance: ['Tout Essentielle', 'Finance et TVA', 'Litiges et remboursements', 'Copilote IA', 'Social Media IA'],
  performance: ['Tout Croissance', 'Prospection commerciale', 'Thème et permissions avancées', 'Support prioritaire'],
};

const PRICING: Record<Region, {
  currency: string;
  flag: string;
  label: string;
  tiers: { name: string; price: number; period: string; features: string[]; highlighted?: boolean }[];
}> = {
  tunisie: {
    currency: 'TND', flag: '🇹🇳', label: 'Tunisie',
    tiers: [
      { name: 'Essentielle', price: 89, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 149, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 249, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  france: {
    currency: 'EUR', flag: '🇫🇷', label: 'France',
    tiers: [
      { name: 'Essentielle', price: 79, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 129, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 199, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  maroc: {
    currency: 'MAD', flag: '🇲🇦', label: 'Maroc',
    tiers: [
      { name: 'Essentielle', price: 349, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 599, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 899, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  algerie: {
    currency: 'DZD', flag: '🇩🇿', label: 'Algérie',
    tiers: [
      { name: 'Essentielle', price: 3900, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 6900, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 10900, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  senegal: {
    currency: 'XOF', flag: '🇸🇳', label: 'Sénégal',
    tiers: [
      { name: 'Essentielle', price: 19900, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 34900, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 54900, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  cote_ivoire: {
    currency: 'XOF', flag: '🇨🇮', label: "Côte d'Ivoire",
    tiers: [
      { name: 'Essentielle', price: 19900, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 34900, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 54900, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  uae: {
    currency: 'AED', flag: '🇦🇪', label: 'UAE',
    tiers: [
      { name: 'Essentielle', price: 349, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 599, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 899, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
  belgique: {
    currency: 'EUR', flag: '🇧🇪', label: 'Belgique',
    tiers: [
      { name: 'Essentielle', price: 79, period: '/mois', features: BASE_FEATURES.essentielle },
      { name: 'Croissance', price: 129, period: '/mois', highlighted: true, features: BASE_FEATURES.croissance },
      { name: 'Performance', price: 199, period: '/mois', features: BASE_FEATURES.performance },
    ],
  },
};

// Devine la région depuis le fuseau horaire du navigateur — aucune
// dépendance réseau (pas de service de géolocalisation IP externe,
// non vérifiable depuis mon environnement de test). Approximatif mais
// gratuit et fonctionne hors-ligne ; l'utilisateur peut toujours corriger
// manuellement avec le sélecteur.
function guessRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const map: Record<string, Region> = {
      'Europe/Paris': 'france',
      'Europe/Brussels': 'belgique',
      'Africa/Casablanca': 'maroc',
      'Africa/Algiers': 'algerie',
      'Africa/Dakar': 'senegal',
      'Africa/Abidjan': 'cote_ivoire',
      'Asia/Dubai': 'uae',
      'Africa/Tunis': 'tunisie',
    };
    return map[tz] || 'tunisie';
  } catch {
    return 'tunisie';
  }
}

export default function PricingPage() {
  const [region, setRegion] = useState<Region>('tunisie');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRegion(guessRegion());
    setMounted(true);
  }, []);

  const data = PRICING[region];

  return (
    <div style={{ minHeight: '100vh', background: '#081522', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
            Nover<span style={{ color: '#00C48C' }}>Resto</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'serif', margin: '8px 0' }}>
            Des tarifs <span style={{ color: '#00C48C' }}>simples et clairs</span>
          </h1>
          <p style={{ color: '#8BAABF', fontSize: 14 }}>Sans engagement. Vos profits ne dorment jamais.</p>
        </div>

        {/* Sélecteur de région */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, margin: '28px 0 40px' }}>
          {(Object.keys(PRICING) as Region[]).map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              style={{
                padding: '8px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${region === r ? '#00C48C' : '#1A3A52'}`,
                background: region === r ? 'rgba(0,196,140,0.12)' : 'transparent',
                color: region === r ? '#00C48C' : '#8BAABF',
              }}
            >
              {PRICING[r].flag} {PRICING[r].label}
            </button>
          ))}
        </div>
        {mounted && (
          <p style={{ textAlign: 'center', color: '#6A8FAB', fontSize: 11, marginTop: -28, marginBottom: 32 }}>
            Région suggérée automatiquement — vous pouvez la changer ci-dessus.
          </p>
        )}

        {/* Grille de tarifs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {data.tiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: '#0F2D40', borderRadius: 16, padding: 28,
                border: tier.highlighted ? '2px solid #00C48C' : '1px solid #1A3A52',
                position: 'relative',
              }}
            >
              {tier.highlighted && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#00C48C', color: '#081522', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999 }}>
                  LE PLUS CHOISI
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{tier.name}</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{tier.price.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 16, color: '#8BAABF' }}> {data.currency}{tier.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#8BAABF' }}>
                    <span style={{ color: '#00C48C' }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#6A8FAB', fontSize: 11, marginTop: 40 }}>
          Prix indicatifs, hors taxes. Contactez-nous pour une offre adaptée à votre établissement.
        </p>
      </div>
    </div>
  );
}
