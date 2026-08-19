'use client'
import { useEffect, useState } from 'react'
import { useCurrentRestaurant } from '../restaurant/useCurrentRestaurant'
import { RestaurantSelector } from '../restaurant/RestaurantSelector'

const C = { teal:'var(--accent)', amber:'var(--warning)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)', navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

function authHeaders(json?: boolean) {
  const h: any = { 'Authorization': `Bearer ${getToken()}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

/**
 * Parse un CSV de clients : telephone (requis), nom, date de naissance.
 * Meme convention que /dashboard/import (headers flexibles, separateur
 * auto-detecte ; virgule ou point-virgule).
 */
function parseCustomersCSV(text: string) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { rows: [], errors: ['Fichier vide'] }
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const phoneCol    = headers.findIndex(h => ['telephone', 'téléphone', 'phone', 'tel', 'tél'].includes(h))
  const nameCol     = headers.findIndex(h => ['nom', 'name', 'client'].includes(h))
  const birthdayCol = headers.findIndex(h => ['naissance', 'date_naissance', 'birthday', 'anniversaire'].includes(h))
  const errors: string[] = []
  if (phoneCol === -1) errors.push('Colonne "telephone" non trouvée')
  if (errors.length) return { rows: [], errors }
  const rows: any[] = []
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(sep).map(c => c.trim().replace(/['"]/g, ''))
    const phone = cols[phoneCol]
    if (!phone) { errors.push(`Ligne ${i + 2}: téléphone manquant`); return }
    rows.push({
      phone,
      name: nameCol >= 0 ? (cols[nameCol] || null) : null,
      birthday: birthdayCol >= 0 ? (cols[birthdayCol] || null) : null,
    })
  })
  return { rows, errors }
}

export default function FidelisationPage() {
  const { restaurant, restaurants, selectRestaurant, loading: restaurantLoading } = useCurrentRestaurant()
  // Ajoute restaurant_id a une URL relative de l'API — necessaire pour
  // qu'un admin/franchise_owner voie les donnees du restaurant SELECTIONNE
  // (pas systematiquement son propre compte). restaurantScopeMiddleware
  // lit req.query.restaurant_id en priorite, quelle que soit la methode.
  const withRid = (url: string) => `${url}${url.includes('?') ? '&' : '?'}restaurant_id=${restaurant?.id}`
  const [overview, setOverview] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [winback, setWinback] = useState<any[]>([])
  const [birthdays, setBirthdays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBirthdayFor, setEditingBirthdayFor] = useState<number | null>(null)
  const [birthdayValue, setBirthdayValue] = useState('')

  // ---- Fiche client detaillee ----
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ---- Ajout manuel ----
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ phone: '', name: '', birthday: '' })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  // ---- Import CSV ----
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvParsed, setCsvParsed] = useState<any>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  function loadAll() {
    if (!restaurant) return
    setLoading(true)
    Promise.all([
      fetch(withRid('/api/v1/restaurant/loyalty/overview'), { headers: authHeaders() }).then(r => r.json()),
      fetch(withRid('/api/v1/restaurant/loyalty/customers'), { headers: authHeaders() }).then(r => r.json()),
      fetch(withRid('/api/v1/restaurant/loyalty/campaigns/winback'), { headers: authHeaders() }).then(r => r.json()),
      fetch(withRid('/api/v1/restaurant/loyalty/campaigns/birthday'), { headers: authHeaders() }).then(r => r.json()),
    ]).then(([overviewData, customersData, winbackData, birthdayData]) => {
      setOverview(overviewData)
      setCustomers(customersData.data || [])
      setWinback(winbackData.data || [])
      setBirthdays(birthdayData.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [restaurant?.id])

  async function saveBirthday(customerId: number) {
    await fetch(withRid(`/api/v1/restaurant/loyalty/customers/${customerId}/birthday`), {
      method: 'PATCH', headers: authHeaders(true),
      body: JSON.stringify({ birthday: birthdayValue || null })
    })
    setEditingBirthdayFor(null)
    setBirthdayValue('')
    loadAll()
  }

  function openCustomer(customerId: number) {
    setSelectedId(customerId)
    setDetail(null)
    setDetailLoading(true)
    setConfirmDelete(false)
    fetch(withRid(`/api/v1/restaurant/loyalty/customers/${customerId}`), { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setDetail(d); setNotesDraft(d.notes || '') })
      .finally(() => setDetailLoading(false))
  }

  function closeCustomer() {
    setSelectedId(null); setDetail(null); setConfirmDelete(false)
  }

  async function saveNotes() {
    if (!selectedId) return
    setSavingNotes(true)
    try {
      const r = await fetch(withRid(`/api/v1/restaurant/loyalty/customers/${selectedId}/notes`), {
        method: 'PATCH', headers: authHeaders(true),
        body: JSON.stringify({ notes: notesDraft })
      })
      const updated = await r.json()
      setDetail((d: any) => d ? { ...d, notes: updated.notes } : d)
    } finally { setSavingNotes(false) }
  }

  async function confirmDeleteCustomer() {
    if (!selectedId) return
    setDeleting(true)
    try {
      await fetch(withRid(`/api/v1/restaurant/loyalty/customers/${selectedId}`), { method: 'DELETE', headers: authHeaders() })
      closeCustomer()
      loadAll()
    } finally { setDeleting(false) }
  }

  async function submitAddCustomer() {
    setAddError('')
    if (!addForm.phone.trim()) { setAddError('Le téléphone est requis'); return }
    setAddSaving(true)
    try {
      const r = await fetch(withRid('/api/v1/restaurant/loyalty/customers'), {
        method: 'POST', headers: authHeaders(true),
        body: JSON.stringify({ phone: addForm.phone.trim(), name: addForm.name.trim() || null, birthday: addForm.birthday || null })
      })
      const d = await r.json()
      if (!r.ok) { setAddError(d.error || 'Erreur lors de la création'); return }
      setShowAddModal(false)
      setAddForm({ phone: '', name: '', birthday: '' })
      loadAll()
    } finally { setAddSaving(false) }
  }

  function handleCsvFile(f: File) {
    setCsvFileName(f.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = e => setCsvParsed(parseCustomersCSV(e.target?.result as string))
    reader.readAsText(f, 'UTF-8')
  }

  async function runImport() {
    if (!csvParsed?.rows?.length) return
    setImporting(true)
    try {
      const r = await fetch(withRid('/api/v1/restaurant/loyalty/customers/import'), {
        method: 'POST', headers: authHeaders(true),
        body: JSON.stringify({ rows: csvParsed.rows })
      })
      const d = await r.json()
      setImportResult(d)
      loadAll()
    } finally { setImporting(false) }
  }

  function closeImportModal() {
    setShowImportModal(false); setCsvParsed(null); setCsvFileName(''); setImportResult(null)
  }

  const inp = { width: '100%', background: 'var(--bg-page)', border: `1px solid ${C.navyL}`, borderRadius: 8, padding: '9px 13px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' as any }

  if (restaurantLoading || loading) {
    return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Chargement...</div>
  }

  const kpis = overview ? [
    { label: 'Clients inscrits', value: String(overview.total_customers), color: 'var(--accent)' },
    { label: 'Clients VIP',      value: String(overview.vip_customers),   color: 'var(--warning)' },
    { label: 'Taux de retour',   value: `${overview.return_rate_pct}%`,   color: 'var(--success)' },
    { label: 'Dépense fidèle',   value: `${overview.avg_loyal_spend} ${restaurant?.currency || 'TND'}`, color: 'var(--info)' },
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', marginBottom: 4 }}>♥ Fidélisation <span style={{ color: 'var(--accent)' }}>clients</span></h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Programme de points — 1 {restaurant?.currency || 'TND'} dépensé = 1 point</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
          <button onClick={() => setShowImportModal(true)} style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.navyL}`, background: 'transparent', color: C.gray, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>📥 Importer CSV</button>
          <button onClick={() => { setAddForm({ phone: '', name: '', birthday: '' }); setAddError(''); setShowAddModal(true) }} style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, border: 'none', background: C.teal, color: C.navyD, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>+ Nouveau client</button>
        </div>
      </div>
      <div style={{ marginBottom: 20 }} />

      {overview?.total_customers === 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, marginBottom: 20, color: 'var(--text-muted)', fontSize: 13 }}>
          Aucun client fidélité pour l'instant. Ajoutez un client manuellement, importez un CSV, ou renseignez le téléphone du client à la prise de commande.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.color }}></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>🏆 Niveaux fidélité</div>
          {overview?.tiers?.map((l: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-page)', borderRadius: 10, marginBottom: 8, border: `1px solid ${l.key === 'vip' ? 'var(--warning)' : l.key === 'habitue' ? 'var(--text-secondary)' : '#8B6A3A'}40` }}>
              <div style={{ fontSize: 24 }}>{l.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.name} · {l.min}{l.max ? `–${l.max}` : '+'} pts</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{l.count}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👥 Clients (top 10)</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Cliquez sur un client pour voir sa fiche détaillée</div>
          {customers.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun client pour l'instant.</div>}
          {customers.slice(0, 10).map((c: any) => (
            <div key={c.id} onClick={() => openCustomer(c.id)} style={{ padding: '10px 14px', background: 'var(--bg-page)', borderRadius: 10, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 20 }}>{c.tier.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name || c.phone}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.orders_count} commande(s) · {c.tier.name}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{c.points} pts</div>
              </div>
              {editingBirthdayFor === c.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={birthdayValue}
                    onChange={(e) => setBirthdayValue(e.target.value)}
                    style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12 }}
                  />
                  <button onClick={() => saveBirthday(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>OK</button>
                  <button onClick={() => setEditingBirthdayFor(null)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Annuler</button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingBirthdayFor(c.id); setBirthdayValue(c.birthday ? String(c.birthday).slice(0, 10) : '') }}
                  style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 6 }}
                >
                  {c.birthday ? `🎂 ${String(c.birthday).slice(5, 10)}` : '+ Ajouter date de naissance'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔄 Win-back</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Clients absents depuis plus de 21 jours — envoi manuel via WhatsApp</div>
          {winback.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun client à relancer pour l'instant.</div>}
          {winback.map((w: any) => (
            <div key={w.customer_id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--bg-page)', borderRadius: 10, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{w.name || w.phone}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Absent depuis {w.days_since_last_order} jours</div>
              </div>
              <a href={w.whatsapp_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, background: '#25D366', color: '#fff', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                💬 WhatsApp
              </a>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🎂 Anniversaires du jour</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Envoi manuel via WhatsApp</div>
          {birthdays.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun anniversaire aujourd'hui.</div>}
          {birthdays.map((b: any) => (
            <div key={b.customer_id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--bg-page)', borderRadius: 10, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{b.name || b.phone}</div>
              </div>
              <a href={b.whatsapp_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, background: '#25D366', color: '#fff', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                💬 WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Modal : fiche client detaillee ---- */}
      {selectedId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={closeCustomer}>
          <div style={{ background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={closeCustomer} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>

            {detailLoading && <div style={{ color: C.muted, padding: 20 }}>Chargement...</div>}

            {detail && !detailLoading && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 32 }}>{detail.tier.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{detail.name || detail.phone}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{detail.phone} · {detail.tier.name} · client depuis le {new Date(detail.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{detail.points} pts</div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 Notes</div>
                  <textarea
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    placeholder="Préférences, allergies, remarques..."
                    rows={3}
                    style={{ ...inp, resize: 'vertical', fontFamily: 'Inter,sans-serif' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={saveNotes} disabled={savingNotes} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: C.teal, color: C.navyD, fontWeight: 700, cursor: savingNotes ? 'not-allowed' : 'pointer' }}>
                      {savingNotes ? '⟳ Sauvegarde...' : '💾 Enregistrer les notes'}
                    </button>
                  </div>
                </div>

                {/* Historique commandes */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🧾 Historique des commandes ({detail.orders.length})</div>
                  {detail.orders.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted }}>Aucune commande rattachée à ce client.</div>
                  ) : (
                    <div style={{ border: `1px solid ${C.navyL}`, borderRadius: 10, overflow: 'hidden' }}>
                      {detail.orders.map((o: any, i: number) => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-alt)', borderTop: i > 0 ? '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' : 'none' }}>
                          <span style={{ color: C.gray }}>#{o.id} · {new Date(o.received_at).toLocaleDateString('fr-FR')}</span>
                          <span style={{ color: C.muted }}>{o.status}</span>
                          <span style={{ fontWeight: 700, color: C.teal }}>{Number(o.gross_amount).toFixed(2)} {restaurant?.currency || 'TND'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grand-livre points */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⭐ Historique des points ({detail.points_ledger.length} mouvement(s))</div>
                  {detail.points_ledger.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted }}>Aucun mouvement de points.</div>
                  ) : (
                    <div style={{ border: `1px solid ${C.navyL}`, borderRadius: 10, overflow: 'hidden' }}>
                      {detail.points_ledger.map((l: any, i: number) => (
                        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: 12, background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-alt)', borderTop: i > 0 ? '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' : 'none' }}>
                          <span style={{ color: C.gray }}>{new Date(l.created_at).toLocaleDateString('fr-FR')} · {l.reason}</span>
                          <span style={{ fontWeight: 700, color: l.points_delta >= 0 ? C.teal : C.red }}>{l.points_delta >= 0 ? '+' : ''}{l.points_delta} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suppression */}
                <div style={{ borderTop: `1px solid ${C.navyL}`, paddingTop: 16 }}>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, fontWeight: 700, cursor: 'pointer' }}>
                      🗑 Supprimer ce client
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.red }}>Supprimer définitivement {detail.name || detail.phone} et son historique de points ?</span>
                      <button onClick={confirmDeleteCustomer} disabled={deleting} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                        {deleting ? '⟳...' : 'Confirmer'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.navyL}`, background: 'transparent', color: C.gray, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- Modal : ajout manuel d'un client ---- */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>+ Nouveau client</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Téléphone *</label>
              <input style={inp} value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+216 XX XXX XXX" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Nom</label>
              <input style={inp} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du client" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Date de naissance</label>
              <input type="date" style={inp} value={addForm.birthday} onChange={e => setAddForm(f => ({ ...f, birthday: e.target.value }))} />
            </div>
            {addError && <div style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>{addError}</div>}
            <button onClick={submitAddCustomer} disabled={addSaving} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: addSaving ? C.navyL : C.teal, color: addSaving ? C.muted : C.navyD, fontSize: 14, fontWeight: 700, cursor: addSaving ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {addSaving ? '⟳ Création...' : '✅ Créer le client'}
            </button>
          </div>
        </div>
      )}

      {/* ---- Modal : import CSV ---- */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={closeImportModal}>
          <div style={{ background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={closeImportModal} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>📥 Importer des clients (CSV)</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Colonnes attendues : <code style={{ color: C.teal }}>telephone</code> (requis), <code style={{ color: C.teal }}>nom</code>, <code style={{ color: C.teal }}>naissance</code> (optionnels)</div>

            {!csvParsed && (
              <label style={{ display: 'block', border: `2px dashed ${C.navyL}`, borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Choisir un fichier CSV</div>
                <div style={{ fontSize: 11, color: C.muted }}>telephone,nom,naissance</div>
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
              </label>
            )}

            {csvParsed && !importResult && (
              <div>
                <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{csvFileName} — {csvParsed.rows.length} ligne(s) valide(s){csvParsed.errors.length > 0 ? `, ${csvParsed.errors.length} erreur(s)` : ''}</div>
                {csvParsed.errors.length > 0 && (
                  <div style={{ background: 'rgba(232,69,69,.08)', border: '1px solid rgba(232,69,69,.3)', borderRadius: 10, padding: 12, marginBottom: 12, maxHeight: 120, overflowY: 'auto' }}>
                    {csvParsed.errors.map((e: string, i: number) => <div key={i} style={{ fontSize: 11, color: C.red }}>• {e}</div>)}
                  </div>
                )}
                {csvParsed.rows.length > 0 && (
                  <div style={{ border: `1px solid ${C.navyL}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                    {csvParsed.rows.slice(0, 8).map((r: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 12px', fontSize: 12, background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-alt)' }}>
                        <span style={{ color: C.teal, fontWeight: 700 }}>{r.phone}</span>
                        <span style={{ color: C.gray }}>{r.name || '—'}</span>
                        <span style={{ color: C.muted }}>{r.birthday || '—'}</span>
                      </div>
                    ))}
                    {csvParsed.rows.length > 8 && <div style={{ padding: '6px 12px', fontSize: 11, color: C.muted }}>... et {csvParsed.rows.length - 8} lignes supplémentaires</div>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setCsvParsed(null); setCsvFileName('') }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.navyL}`, background: 'transparent', color: C.gray, fontSize: 13, cursor: 'pointer' }}>← Changer</button>
                  <button onClick={runImport} disabled={importing || csvParsed.rows.length === 0} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: importing ? C.navyL : C.teal, color: importing ? C.muted : C.navyD, fontSize: 13, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer' }}>
                    {importing ? '⟳ Import en cours...' : `✅ Importer ${csvParsed.rows.length} client(s)`}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div>
                <div style={{ background: 'rgba(0,196,140,.08)', border: '1px solid rgba(0,196,140,.3)', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 14, color: C.gray }}><strong style={{ color: C.teal }}>{importResult.inserted}</strong> client(s) importé(s) · {importResult.skipped} ignoré(s)</div>
                </div>
                {importResult.errors?.length > 0 && (
                  <div style={{ background: 'rgba(232,69,69,.08)', border: '1px solid rgba(232,69,69,.3)', borderRadius: 10, padding: 12, marginBottom: 16, maxHeight: 150, overflowY: 'auto' }}>
                    {importResult.errors.map((e: string, i: number) => <div key={i} style={{ fontSize: 11, color: C.red }}>• {e}</div>)}
                  </div>
                )}
                <button onClick={closeImportModal} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: C.teal, color: C.navyD, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Terminer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
