'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email:'', password:'', name:'', restaurant:'', country:'' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function doLogin() {
    setError(''); setLoading(true)
    try {
      const d = await api.login(form.email, form.password)
      document.cookie = `nr_token=${d.token}; path=/; max-age=${7*24*3600}`
      document.cookie = `nr_user=${encodeURIComponent(JSON.stringify(d.user))}; path=/; max-age=${7*24*3600}`
      router.push('/dashboard')
    } catch(e: any) { setError(e.message) }
    setLoading(false)
  }

  async function doRegister() {
    setError(''); setLoading(true)
    try {
      const d = await api.register(form)
      document.cookie = `nr_token=${d.token}; path=/; max-age=${7*24*3600}`
      document.cookie = `nr_user=${encodeURIComponent(JSON.stringify(d.user))}; path=/; max-age=${7*24*3600}`
      router.push('/dashboard')
    } catch(e: any) { setError(e.message) }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width:'100%', background:'#081522', border:'1px solid #1A3A52', borderRadius:8, padding:'10px 13px', fontSize:14, color:'#fff', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:600, color:'#8BAABF', textTransform:'uppercase', letterSpacing:.4, marginBottom:5 }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#081522', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:28, fontWeight:800 }}>Nover<span style={{ color:'#00C48C' }}>Resto</span></div>
          <div style={{ fontSize:13, color:'#6A8FAB', marginTop:4 }}>Plateforme IA de gestion de restaurants MENA</div>
        </div>

        {/* Card */}
        <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:16, padding:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, background:'#081522', borderRadius:10, padding:4, marginBottom:24 }}>
            {(['login','register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }} style={{
                flex:1, padding:'8px 0', borderRadius:7, border:'none', fontSize:13, fontWeight:600,
                cursor:'pointer', fontFamily:'Inter,sans-serif',
                background: tab===t ? '#00C48C' : 'transparent',
                color: tab===t ? '#081522' : '#6A8FAB',
                transition:'all .2s'
              }}>
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <div>
              {/* Demo creds */}
              <div style={{ background:'#081522', border:'1px solid #1A3A52', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12 }}>
                <div style={{ color:'#00C48C', fontWeight:700, marginBottom:6 }}>🔐 Comptes de démo</div>
                <div style={{ color:'#8BAABF', marginBottom:3 }}>Admin : <span style={{ color:'#00C48C' }}>admin@noveresto.app</span> / <span style={{ color:'#00C48C' }}>Admin2025!</span></div>
                <div style={{ color:'#8BAABF' }}>Client : <span style={{ color:'#00C48C' }}>demo@noveresto.app</span> / <span style={{ color:'#00C48C' }}>Demo2025!</span></div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" placeholder="vous@restaurant.com" value={form.email} onChange={e=>set('email',e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Mot de passe</label>
                <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
              </div>
              {error && <div style={{ background:'rgba(232,69,69,.12)', border:'1px solid #E84545', borderRadius:8, padding:'8px 13px', fontSize:13, color:'#E84545', marginBottom:12 }}>{error}</div>}
              <button onClick={doLogin} disabled={loading} style={{ width:'100%', padding:'12px 0', background: loading ? '#1A3A52' : '#00C48C', color: loading ? '#6A8FAB' : '#081522', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif' }}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <span style={{ fontSize:13, color:'#6A8FAB' }}>Pas encore de compte ? </span>
                <span style={{ fontSize:13, color:'#00C48C', cursor:'pointer' }} onClick={() => setTab('register')}>S'inscrire →</span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={lbl}>Prénom *</label><input style={inp} placeholder="Karim" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
                <div><label style={lbl}>Restaurant *</label><input style={inp} placeholder="Burger House" value={form.restaurant} onChange={e=>set('restaurant',e.target.value)} /></div>
              </div>
              <div style={{ marginBottom:14 }}><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="vous@restaurant.com" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Pays</label>
                <select style={inp} value={form.country} onChange={e=>set('country',e.target.value)}>
                  <option value="">Sélectionner...</option>
                  <option>🇹🇳 Tunisie</option><option>🇲🇦 Maroc</option><option>🇩🇿 Algérie</option>
                  <option>🇸🇳 Sénégal</option><option>🇦🇪 UAE</option><option>Autre</option>
                </select>
              </div>
              <div style={{ marginBottom:14 }}><label style={lbl}>Mot de passe * (8 min.)</label><input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} /></div>
              {error && <div style={{ background:'rgba(232,69,69,.12)', border:'1px solid #E84545', borderRadius:8, padding:'8px 13px', fontSize:13, color:'#E84545', marginBottom:12 }}>{error}</div>}
              <button onClick={doRegister} disabled={loading} style={{ width:'100%', padding:'12px 0', background: loading ? '#1A3A52' : '#00C48C', color: loading ? '#6A8FAB' : '#081522', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif' }}>
                {loading ? 'Création...' : 'Créer mon compte gratuitement'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <span style={{ fontSize:13, color:'#6A8FAB' }}>Déjà un compte ? </span>
                <span style={{ fontSize:13, color:'#00C48C', cursor:'pointer' }} onClick={() => setTab('login')}>Se connecter →</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign:'center', marginTop:16 }}>
          <a href="/" style={{ fontSize:12, color:'#3A5570', textDecoration:'none' }}>← Retour au site</a>
        </div>
      </div>
    </div>
  )
}
