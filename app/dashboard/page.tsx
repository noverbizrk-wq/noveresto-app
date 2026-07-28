'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const KPI = ({ label, value, delta, color }: any) => (
  <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }}></div>
    <div style={{ fontSize:10, color:'#6A8FAB', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:800 }}>{value}</div>
    <div style={{ fontSize:11, marginTop:4, padding:'2px 8px', borderRadius:10, display:'inline-block', background:`${color}20`, color }}>{delta}</div>
  </div>
)

const Alert = ({ severity, title, detail }: any) => {
  const colors: any = { critical:'#E84545', warning:'#F5A623', info:'#3B82F6' }
  const c = colors[severity] || '#6A8FAB'
  return (
    <div style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #1A3A5230' }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0, marginTop:5 }}></div>
      <div>
        <div style={{ fontSize:12, fontWeight:700 }}>{title}</div>
        <div style={{ fontSize:11, color:'#6A8FAB', marginTop:1 }}>{detail}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1]
    if (!token) return
    api.dashboard(token).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div style={{ color:'#00C48C', fontSize:14 }}>Chargement...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>
          Bonjour 👋 — <span style={{ color:'#00C48C' }}>{data?.restaurant || 'Dashboard'}</span>
        </h1>
        <div style={{ fontSize:13, color:'#6A8FAB' }}>Vue d'ensemble · {data?.date}</div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KPI label="CA Aujourd'hui"  value={`${data?.kpis?.revenue_today_tnd?.toLocaleString('fr-FR')} TND`} delta="↑ +8.4%"  color="#00C48C" />
        <KPI label="Couverts"        value={data?.kpis?.covers}                                               delta="↑ +12%"   color="#3B82F6" />
        <KPI label="Food Cost"       value={`${data?.kpis?.food_cost_pct}%`}                                  delta="↓ -2.1pts" color="#27AE60" />
        <KPI label="Ticket Moyen"    value={`${data?.kpis?.avg_ticket_tnd} TND`}                              delta="↑ +3.7%"  color="#F5A623" />
      </div>

      {/* Chart + Alerts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:20 }}>
        {/* Chart */}
        <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>📊 CA Semaine — Réalisé vs Prévision IA</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
            {data?.chart?.map((v: number, i: number) => {
              const max = Math.max(...data.chart)
              const pct = (v / max) * 100
              const isToday = i === data.chart.length - 1
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:9, color:'#6A8FAB' }}>{v.toLocaleString('fr-FR')}</div>
                  <div style={{ width:'100%', borderRadius:'3px 3px 0 0', height:`${pct}%`, background: isToday ? '#00C48C' : `rgba(0,196,140,${0.4 + pct/200})`, minHeight:4 }}></div>
                  <div style={{ fontSize:9, color: isToday ? '#00C48C' : '#6A8FAB', fontWeight: isToday ? 700 : 400 }}>{data.labels?.[i]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>🔔 Alertes actives</div>
          {data?.alerts?.map((a: any, i: number) => <Alert key={i} {...a} />)}
          {(!data?.alerts || data.alerts.length === 0) && (
            <div style={{ fontSize:13, color:'#00C48C', textAlign:'center', paddingTop:20 }}>✅ Aucune alerte</div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Prévision demain', value:'13 200 TND', icon:'🧠', sub:'IA · +5.8% vs aujourd\'hui' },
          { label:'Commandes en attente', value:'4 BDC', icon:'🛒', sub:'Total : 1 840 TND à valider' },
          { label:'Note Google Maps', value:'4.7 ★', icon:'⭐', sub:'1 248 avis · +12 ce mois' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:18, display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:11, color:'#6A8FAB', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#00C48C' }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#6A8FAB', marginTop:2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
