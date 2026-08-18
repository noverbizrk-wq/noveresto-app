'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = { navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)', teal:'var(--accent)', amber:'var(--warning)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}
function getUser() {
  try {
    const c = document.cookie.split(';').find(c => c.trim().startsWith('nr_user='))
    return c ? JSON.parse(decodeURIComponent(c.split('=')[1])) : null
  } catch { return null }
}

function Badge({ text, color }: any) {
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:`color-mix(in srgb, ${color} 20%, transparent)`, color, border:`1px solid color-mix(in srgb, ${color} 40%, transparent)` }}>
      {text}
    </span>
  )
}

function StatCard({ label, value, color, sub }: any) {
  return (
    <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:12, padding:16, borderTop:`2px solid ${color}` }}>
      <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<'users'|'contacts'|'system'>('users')
  const [users, setUsers]       = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const token = getToken()
    const headers = { 'Authorization': `Bearer ${token}` }
    try {
      const [uRes, cRes] = await Promise.all([
        fetch('/api/v1/admin/users', { headers }),
        fetch('/api/v1/admin/contacts', { headers }),
      ])
      const uData = await uRes.json()
      const cData = await cRes.json()
      setUsers(uData.users || [])
      setContacts(cData.contacts || [])
    } catch(e) {}
    setLoading(false)
  }

  async function toggleActive(u: any) {
    const action = u.is_active === false ? 'reactivate' : 'deactivate'
    if (action === 'deactivate' && !confirm(`Désactiver le compte "${u.restaurant || u.name}" ? Le login sera bloqué (réversible).`)) return
    setTogglingId(u.id)
    const token = getToken()
    try {
      const r = await fetch(`/api/v1/admin/users/${u.id}/${action}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } })
      if (r.ok) {
        const updated = await r.json()
        setUsers(us => us.map(x => x.id === u.id ? { ...x, is_active: updated.is_active, deactivated_at: updated.deactivated_at } : x))
      }
    } catch (e) {}
    setTogglingId(null)
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.restaurant?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || u.role === filter
    return matchSearch && matchFilter
  })

  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.restaurant?.toLowerCase().includes(q)
  })

  const newContacts  = contacts.filter(c => c.status === 'new' || !c.status).length
  const adminCount   = users.filter(u => u.role === 'admin').length
  const clientCount  = users.filter(u => u.role === 'client').length

  const inp = { width:'100%', background:'var(--bg-page)', border:'1px solid var(--border-color)', borderRadius:8, padding:'9px 13px', fontSize:13, color:'var(--text-primary)', outline:'none', fontFamily:'Inter,sans-serif' } as any

  return (
    <div style={{ maxWidth:1100 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>
            ⚙️ Admin <span style={{ color:C.teal }}>Panel</span>
          </h1>
          <div style={{ fontSize:13, color:C.muted }}>Gestion des utilisateurs · Contacts · Système</div>
        </div>
        <button onClick={loadAll} style={{ padding:'8px 16px', background:C.navyM, border:`1px solid ${C.navyL}`, borderRadius:8, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        <StatCard label="Total utilisateurs" value={users.length}    color={C.teal}  sub={`${adminCount} admin · ${clientCount} clients`} />
        <StatCard label="Contacts reçus"     value={contacts.length} color="var(--info)" sub={`${newContacts} nouveaux`} />
        <StatCard label="Nouveaux contacts"  value={newContacts}     color={C.amber} sub="En attente de traitement" />
        <StatCard label="Rôle actuel"        value="Admin"           color="var(--purple)" sub="Accès complet" />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--bg-page)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[
          { key:'users',   label:`👥 Utilisateurs (${users.length})` },
          { key:'contacts',label:`📧 Contacts (${contacts.length})` },
          { key:'system',  label:'🖥️ Système' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding:'8px 16px', borderRadius:7, border:'none', fontSize:13, fontWeight:600,
            cursor:'pointer', fontFamily:'Inter,sans-serif',
            background: tab===t.key ? C.teal : 'transparent',
            color:      tab===t.key ? C.navyD : C.muted,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Search + Filter */}
      {tab !== 'system' && (
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <input style={{ ...inp, flex:1 }} placeholder={tab==='users' ? 'Rechercher par nom, email, restaurant...' : 'Rechercher un contact...'}
            value={search} onChange={e => setSearch(e.target.value)} />
          {tab === 'users' && (
            <select style={{ ...inp, width:140 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:C.muted, gap:12 }}>
          <div style={{ width:32, height:32, border:`3px solid ${C.navyL}`, borderTopColor:C.teal, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
          Chargement...
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* USERS TAB */}
          {tab === 'users' && (
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, overflow:'hidden' }}>
              {/* Table header */}
              <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.8fr 1.6fr 0.9fr 1fr 1.4fr', gap:12, padding:'12px 16px', background:'var(--bg-card-alt)', fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5 }}>
                <span>Utilisateur</span><span>Email</span><span>Restaurant</span><span>Rôle</span><span>Inscrit le</span><span>Statut</span>
              </div>
              {filteredUsers.length === 0 ? (
                <div style={{ padding:32, textAlign:'center', color:C.muted }}>Aucun utilisateur trouvé</div>
              ) : filteredUsers.map((u, i) => (
                <div key={u.id} style={{
                  display:'grid', gridTemplateColumns:'1.8fr 1.8fr 1.6fr 0.9fr 1fr 1.4fr', gap:12,
                  padding:'12px 16px', borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                  background: i%2===0 ? 'transparent' : 'var(--bg-card-alt)',
                  transition:'background .15s',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:C.teal, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.navyD, flexShrink:0 }}>
                      {u.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
                      <div style={{ fontSize:10, color:C.muted }}>ID #{u.id}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.gray, display:'flex', alignItems:'center' }}>{u.email}</div>
                  <div style={{ fontSize:12, color:C.gray, display:'flex', alignItems:'center' }}>{u.restaurant || '—'}</div>
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <Badge text={u.role === 'admin' ? '👑 Admin' : '🏪 Client'} color={u.role === 'admin' ? 'var(--purple)' : C.teal} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ fontSize:11, color:C.muted }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</div>
                    <div style={{ fontSize:9, color: u.last_login_at ? C.muted : C.amber }} title="Dernière connexion">
                      {u.last_login_at ? `↳ ${new Date(u.last_login_at).toLocaleDateString('fr-FR')}` : '↳ jamais connecté'}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {u.role === 'client' ? (
                      <>
                        <Badge text={u.is_active === false ? '⛔ Désactivé' : '✅ Actif'} color={u.is_active === false ? C.red : 'var(--success)'} />
                        <button
                          onClick={() => toggleActive(u)}
                          disabled={togglingId === u.id}
                          title={u.is_active === false ? 'Réactiver ce compte' : 'Désactiver ce compte'}
                          style={{ fontSize:10, padding:'3px 8px', borderRadius:6, border:`1px solid ${u.is_active === false ? 'var(--success)' : C.red}`, background:'transparent', color: u.is_active === false ? 'var(--success)' : C.red, cursor: togglingId === u.id ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif', whiteSpace:'nowrap' }}
                        >
                          {togglingId === u.id ? '⟳' : (u.is_active === false ? 'Réactiver' : 'Désactiver')}
                        </button>
                      </>
                    ) : <span style={{ fontSize:11, color:C.muted }}>—</span>}
                  </div>
                </div>
              ))}
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-color)', fontSize:11, color:C.muted, background:'var(--bg-card-alt)' }}>
                {filteredUsers.length} utilisateur(s) affiché(s) sur {users.length} total
              </div>
            </div>
          )}

          {/* CONTACTS TAB */}
          {tab === 'contacts' && (
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr 1fr', gap:8, padding:'12px 16px', background:'var(--bg-card-alt)', fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5 }}>
                <span>Contact</span><span>Email</span><span>Restaurant</span><span>Pays</span><span>Objet</span><span>Date</span>
              </div>
              {filteredContacts.length === 0 ? (
                <div style={{ padding:32, textAlign:'center', color:C.muted }}>Aucun contact trouvé</div>
              ) : filteredContacts.map((c, i) => (
                <div key={c.id} style={{ borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)', background: i%2===0 ? 'transparent' : 'var(--bg-card-alt)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr 1fr', gap:8, padding:'12px 16px', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize:10, color:C.muted }}>{c.phone}</div>}
                    </div>
                    <div style={{ fontSize:12, color:C.gray }}>{c.email}</div>
                    <div style={{ fontSize:12, color:C.gray }}>{c.restaurant || '—'}</div>
                    <div style={{ fontSize:12, color:C.gray }}>{c.country || '—'}</div>
                    <div>
                      <Badge text={c.type || 'général'} color={
                        c.type === 'demo' ? C.teal :
                        c.type === 'pricing' ? C.amber :
                        c.type === 'partnership' ? 'var(--purple)' : C.muted
                      } />
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  {/* Message */}
                  {c.message && (
                    <div style={{ margin:'0 16px 12px', padding:'8px 12px', background:'var(--bg-page)', borderRadius:8, fontSize:12, color:C.gray, lineHeight:1.6, borderLeft:`3px solid ${C.teal}` }}>
                      {c.message}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-color)', fontSize:11, color:C.muted, background:'var(--bg-card-alt)' }}>
                {filteredContacts.length} contact(s) affiché(s) sur {contacts.length} total
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {tab === 'system' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🖥️ Services</div>
                {[
                  { name:'API Node.js v1.3.0',    url:'/api/v1/health',         port:'3000', color:C.teal },
                  { name:'Prophet ML v1.0.0',      url:'http://localhost:5000/health', port:'5000', color:'var(--info)' },
                  { name:'Dashboard Next.js',      url:null,                    port:'3001', color:'var(--purple)' },
                  { name:'PostgreSQL 16',          url:null,                    port:'5432', color:C.amber },
                ].map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{s.name}</div>
                        <div style={{ fontSize:10, color:C.muted }}>Port {s.port}</div>
                      </div>
                    </div>
                    <Badge text="online" color={C.teal} />
                  </div>
                ))}
              </div>

              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>📊 Base de données</div>
                {[
                  { table:'users',              count: users.length },
                  { table:'contacts',           count: contacts.length },
                  { table:'restaurants',        count: '—' },
                  { table:'social_posts',       count: '—' },
                  { table:'editorial_calendars',count: '—' },
                  { table:'sales_data',         count: '365' },
                  { table:'ml_forecasts',       count: '14+' },
                ].map((t, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)', fontSize:12 }}>
                    <span style={{ color:C.gray, fontFamily:'monospace' }}>{t.table}</span>
                    <span style={{ fontWeight:700, color:C.teal }}>{t.count} lignes</span>
                  </div>
                ))}
              </div>

              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🔐 Sécurité</div>
                {[
                  { label:'Authentification',  val:'JWT RS256 · 7 jours' },
                  { label:'Mots de passe',     val:'bcrypt · 10 rounds' },
                  { label:'HTTPS',             val:'Let\'s Encrypt · Oct 2026' },
                  { label:'Base de données',   val:'PostgreSQL 16 · Docker' },
                  { label:'Hébergeur',         val:'Hetzner · Frankfurt' },
                  { label:'CDN/Proxy',         val:'Nginx · AWS Paris eu-west-3' },
                ].map((s, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)', fontSize:12 }}>
                    <span style={{ color:C.gray }}>{s.label}</span>
                    <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🚀 Stack technique</div>
                {[
                  { label:'Frontend',   val:'Next.js 16 · Tailwind · TypeScript' },
                  { label:'Backend',    val:'Node.js v22 · Express · JWT' },
                  { label:'ML Engine',  val:'Python · Prophet 1.3 · Flask' },
                  { label:'Base',       val:'PostgreSQL 16 · Docker' },
                  { label:'Process',    val:'PM2 · 3 processus' },
                  { label:'AI Social',  val:'Claude API · claude-sonnet-4-6' },
                  { label:'Domaine',    val:'noveresto.app · Cloudflare' },
                ].map((s, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)', fontSize:12 }}>
                    <span style={{ color:C.gray }}>{s.label}</span>
                    <span style={{ fontWeight:600, color:'var(--text-primary)', textAlign:'right', maxWidth:200 }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
