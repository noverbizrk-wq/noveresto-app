'use client'
import { useEffect, useState } from 'react'
import { useCurrentRestaurant } from '../restaurant/useCurrentRestaurant'

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

export default function FidelisationPage() {
  const { restaurant, loading: restaurantLoading } = useCurrentRestaurant()
  const [overview, setOverview] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurant) return
    const token = getToken()
    setLoading(true)
    Promise.all([
      fetch('/api/v1/restaurant/loyalty/overview', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/v1/restaurant/loyalty/customers', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([overviewData, customersData]) => {
      setOverview(overviewData)
      setCustomers(customersData.data || [])
    }).finally(() => setLoading(false))
  }, [restaurant?.id])

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
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>♥ Fidélisation <span style={{ color:'var(--accent)' }}>clients</span></h1>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Programme de points — 1 {restaurant?.currency || 'TND'} dépensé = 1 point</div>

      {overview?.total_customers === 0 && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20, marginBottom:20, color:'var(--text-muted)', fontSize:13 }}>
          Aucun client fidélité pour l'instant. Renseignez le téléphone du client à la prise de commande pour commencer à suivre ses points.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {kpis.map((k,i) => (
          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🏆 Niveaux fidélité</div>
          {overview?.tiers?.map((l:any,i:number) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-page)', borderRadius:10, marginBottom:8, border:`1px solid ${l.key==='vip'?'var(--warning)':l.key==='habitue'?'var(--text-secondary)':'#8B6A3A'}40` }}>
              <div style={{ fontSize:24 }}>{l.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{l.name} · {l.min}{l.max ? `–${l.max}` : '+'} pts</div>
              </div>
              <div style={{ fontSize:16, fontWeight:800 }}>{l.count}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>👥 Clients (top 10)</div>
          {customers.length === 0 && <div style={{ fontSize:12, color:'var(--text-muted)' }}>Aucun client pour l'instant.</div>}
          {customers.slice(0, 10).map((c:any) => (
            <div key={c.id} style={{ display:'flex', gap:12, padding:'10px 14px', background:'var(--bg-page)', borderRadius:10, marginBottom:8, alignItems:'center' }}>
              <div style={{ fontSize:20 }}>{c.tier.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{c.name || c.phone}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{c.orders_count} commande(s) · {c.tier.name}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--accent)' }}>{c.points} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
