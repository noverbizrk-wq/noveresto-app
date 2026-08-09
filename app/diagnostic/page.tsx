'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface DiagnosticResult {
  name: string;
  address: string | null;
  has_website: boolean;
  rating: number | null;
  review_count: number;
  opportunity_tier: 'invisible' | 'presence_faible' | 'etabli';
  tier_title: string;
  tier_body: string;
  recommendations: string[];
}

const TIER_COLORS: Record<string, string> = {
  invisible: '#E84545', presence_faible: '#F5A623', etabli: '#00C48C'
};
const TIER_LABELS: Record<string, string> = {
  invisible: 'Invisible', presence_faible: 'Présence faible', etabli: 'Établi'
};

// Numéro de contact commercial (Foued SAKRI, Directeur Commercial)
const CONTACT_WHATSAPP = '21699507035';

export default function PublicDiagnosticPage() {
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    if (!businessName.trim() || !city.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.publicDiagnostic(businessName.trim(), city.trim());
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Le diagnostic a échoué. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = result
    ? `Bonjour, je viens de faire le diagnostic de visibilité pour ${result.name} et j'aimerais en discuter avec vous.`
    : '';
  const whatsappLink = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #1A3A52',
    background: '#0F2D40', color: '#fff', fontSize: 15, marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#081522', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Nover<span style={{ color: '#00C48C' }}>Resto</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'serif', margin: '16px 0 8px' }}>
            Diagnostic gratuit de <span style={{ color: '#00C48C' }}>visibilité en ligne</span>
          </h1>
          <p style={{ color: '#8BAABF', fontSize: 14 }}>
            En 30 secondes, découvrez comment votre restaurant est perçu en ligne — et ce que vos concurrents ont peut-être déjà compris avant vous.
          </p>
        </div>

        <div style={{ background: '#0F2D40', border: '1px solid #1A3A52', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <input
            placeholder="Nom de votre établissement"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Ville (ex: Ariana, Tunis, Sfax...)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runDiagnostic(); }}
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <button
            onClick={runDiagnostic}
            disabled={loading || !businessName.trim() || !city.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              background: (loading || !businessName.trim() || !city.trim()) ? '#1A3A52' : '#00C48C',
              color: (loading || !businessName.trim() || !city.trim()) ? '#6A8FAB' : '#081522',
            }}
          >
            {loading ? 'Analyse en cours...' : '🔍 Lancer mon diagnostic'}
          </button>
          {error && <p style={{ color: '#E84545', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
        </div>

        {result && (
          <div style={{ background: '#0F2D40', border: `1px solid ${TIER_COLORS[result.opportunity_tier]}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{result.name}</div>
                <div style={{ color: '#8BAABF', fontSize: 12 }}>{result.address}</div>
              </div>
              <span style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: `${TIER_COLORS[result.opportunity_tier]}22`, color: TIER_COLORS[result.opportunity_tier],
              }}>
                {TIER_LABELS[result.opportunity_tier]}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: '#8BAABF' }}>
              <span>{result.has_website ? '🌐 Site web' : '🚫 Aucun site web'}</span>
              <span>{result.rating ? `⭐ ${result.rating} (${result.review_count} avis)` : 'Aucun avis'}</span>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{result.tier_title}</h2>
            <p style={{ color: '#8BAABF', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{result.tier_body}</p>

            <div style={{ marginBottom: 20 }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: '#00C48C' }}>→</span>
                  <span style={{ color: '#fff' }}>{rec}</span>
                </div>
              ))}
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: 10,
                background: '#00C48C', color: '#081522', fontWeight: 700, fontSize: 15, textDecoration: 'none',
              }}
            >
              💬 Discuter de mon diagnostic avec NoveResto
            </a>
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#6A8FAB', fontSize: 11, marginTop: 32 }}>
          Diagnostic basé sur les données Google Maps publiques de votre établissement. NoveResto — Vos profits ne dorment jamais.
        </p>
      </div>
    </div>
  );
}
