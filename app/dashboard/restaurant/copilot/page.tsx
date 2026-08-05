'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { RestaurantSelector } from '../RestaurantSelector';

interface Recommendation {
  type: string;
  constat: string;
  donnees: string;
  impact: string;
  action: string;
  confiance: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'Quel est mon produit le plus rentable ?',
  'Pourquoi ma marge a-t-elle baissé cette semaine ?',
  'Quels produits risquent la rupture demain ?',
  'Quelle plateforme génère le meilleur résultat net ?'
];

const CONFIDENCE_COLORS: Record<string, string> = { haute: 'var(--accent)', moyenne: 'var(--warning)', basse: 'var(--text-muted)' };

export default function CopilotPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    api.restaurantCopilotRecommendations(token, restaurant.id)
      .then((json) => setRecommendations(json.data || []))
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (question: string) => {
    if (!restaurant || !token || !question.trim() || asking) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setAsking(true);
    try {
      const result = await api.restaurantCopilotAsk(token, restaurant.id, question);
      setMessages((m) => [...m, { role: 'assistant', text: result.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'error', text: 'Le copilote n\'a pas pu répondre. Réessayez dans un instant.' }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          🧠 Copilote <span style={{ color: 'var(--accent)' }}>Restaurant</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Chat */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Posez une question sur votre restaurant — le copilote répond à partir de vos données réelles.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card-alt)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                  background: m.role === 'user' ? 'var(--accent)' : m.role === 'error' ? 'rgba(232,69,69,.15)' : 'var(--bg-card-alt)',
                  color: m.role === 'user' ? 'var(--bg-card-alt)' : m.role === 'error' ? 'var(--danger)' : 'var(--text-primary)'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {asking && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Le copilote réfléchit...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border-color)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') ask(input); }}
              placeholder="Posez votre question..."
              style={{ flex: 1, background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <button
              onClick={() => ask(input)}
              disabled={asking}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Recommandations */}
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recommandations</h2>
          {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement...</p>}
          {!loading && recommendations.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune alerte pour le moment. Tout semble sous contrôle.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{r.constat}</span>
                  <span style={{ fontSize: 10, color: CONFIDENCE_COLORS[r.confiance], fontWeight: 700, textTransform: 'uppercase' }}>{r.confiance}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>{r.donnees}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', marginBottom: 8 }}>{r.impact}</div>
                <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>→ {r.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
