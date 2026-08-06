'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface ModuleRef {
  key: string;
  label: string;
}

interface ClientAccess {
  id: number;
  email: string;
  name: string;
  restaurant: string | null;
  modules: string[];
}

function getToken(): string {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || '';
}

export default function ModuleAccessAdminPage() {
  const [modules, setModules] = useState<ModuleRef[]>([]);
  const [clients, setClients] = useState<ClientAccess[]>([]);
  const [pending, setPending] = useState<Record<number, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const load = useCallback(() => {
    const token = getToken();
    setLoading(true);
    Promise.all([
      api.adminModulesReference(token),
      api.adminClientsAccess(token)
    ])
      .then(([modJson, clientsJson]) => {
        setModules(modJson.data || []);
        const data: ClientAccess[] = clientsJson.data || [];
        setClients(data);
        const initial: Record<number, Set<string>> = {};
        data.forEach(c => { initial[c.id] = new Set(c.modules); });
        setPending(initial);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (clientId: number, moduleKey: string) => {
    setPending(prev => {
      const next = { ...prev };
      const set = new Set(next[clientId]);
      if (set.has(moduleKey)) set.delete(moduleKey); else set.add(moduleKey);
      next[clientId] = set;
      return next;
    });
  };

  const selectAll = (clientId: number) => {
    setPending(prev => ({ ...prev, [clientId]: new Set(modules.map(m => m.key)) }));
  };
  const selectNone = (clientId: number) => {
    setPending(prev => ({ ...prev, [clientId]: new Set() }));
  };

  const save = async (clientId: number) => {
    setSavingId(clientId);
    const token = getToken();
    const moduleKeys = Array.from(pending[clientId] || []);
    await api.adminSetClientModules(token, clientId, moduleKeys);
    setSavingId(null);
    setSavedId(clientId);
    setTimeout(() => setSavedId(null), 2000);
  };

  const isDirty = (client: ClientAccess) => {
    const current = pending[client.id] || new Set();
    const original = new Set(client.modules);
    if (current.size !== original.size) return true;
    for (const k of Array.from(current)) if (!original.has(k)) return true;
    return false;
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', marginBottom: 4, color: 'var(--text-primary)' }}>
        🔐 Gestion <span style={{ color: 'var(--accent)' }}>des accès</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Choisis les modules du restaurant accessibles à chaque compte client. Un compte sans aucun module coché ne voit rien du tout du module "Gestion du restaurant".
      </p>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
      {!loading && clients.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucun compte client trouvé.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {clients.map((client) => {
          const clientModules = pending[client.id] || new Set();
          const dirty = isDirty(client);
          return (
            <div key={client.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>
                    {client.restaurant || client.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{client.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => selectAll(client.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Tout cocher
                  </button>
                  <button onClick={() => selectNone(client.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Tout décocher
                  </button>
                  <button
                    onClick={() => save(client.id)}
                    disabled={!dirty || savingId === client.id}
                    style={{
                      fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: dirty ? 'pointer' : 'default',
                      background: savedId === client.id ? 'var(--success)' : dirty ? 'var(--accent)' : 'var(--border-color)',
                      color: dirty || savedId === client.id ? 'var(--navy)' : 'var(--text-muted)'
                    }}
                  >
                    {savingId === client.id ? '...' : savedId === client.id ? '✓ Enregistré' : dirty ? 'Enregistrer' : 'À jour'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {modules.map((m) => {
                  const checked = clientModules.has(m.key);
                  return (
                    <label
                      key={m.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-color)'}`,
                        background: checked ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                        cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)'
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggle(client.id, m.key)} style={{ accentColor: 'var(--accent)' }} />
                      {m.label}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
