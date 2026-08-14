'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useCurrentRestaurant } from '../restaurant/useCurrentRestaurant'
import { RestaurantSelector } from '../restaurant/RestaurantSelector'

const C = { navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)', teal:'var(--accent)', amber:'var(--warning)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

function BarChart({ forecasts }: { forecasts: any[] }) {
  if (!forecasts?.length) return null
  const max = Math.max(...forecasts.map(f => f.revenue_max))
  const days = { Monday:'Lun', Tuesday:'Mar', Wednesday:'Mer', Thursday:'Jeu', Friday:'Ven', Saturday:'Sam', Sunday:'Dim' } as any

  return (
    <div style={{ width:'100%' }}>
      {/* Barres */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:200, padding:'0 8px', marginBottom:8 }}>
        {forecasts.map((f, i) => {
          const pct     = (f.revenue_tnd / max) * 100
          const pctMax  = (f.revenue_max / max) * 100
          const pctMin  = (f.revenue_min / max) * 100
          const isWeekend = ['Friday','Saturday','Sunday'].includes(f.day)
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', gap:4, position:'relative' }}>
              {/* Tooltip */}
              <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:'var(--bg-card-alt)', border:'1px solid var(--border-color)', borderRadius:6, padding:'4px 8px', fontSize:10, whiteSpace:'nowrap', textAlign:'center', zIndex:10 }}>
                <div style={{ color:'var(--accent)', fontWeight:700 }}>{f.revenue_tnd.toLocaleString('fr-FR')} TND</div>
                <div style={{ color:'var(--text-muted)' }}>{f.covers} couverts</div>
              </div>
              {/* Barre max (interval) */}
              <div style={{ width:'100%', position:'relative', height:`${pctMax}%`, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'100%', background:`rgba(0,196,140,0.12)`, borderRadius:'4px 4px 0 0' }} />
                {/* Barre principale */}
                <div style={{ width:'100%', height:`${(pct/pctMax)*100}%`, background: isWeekend ? C.teal : 'rgba(0,196,140,0.65)', borderRadius:'4px 4px 0 0', position:'relative', minHeight:4 }}>
                  {/* Barre min */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${(pctMin/pct)*100}%`, background:'rgba(0,196,140,0.3)', borderRadius:'4px 4px 0 0' }} />
                </div>
              </div>
              {/* Label jour */}
              <div style={{ fontSize:10, color: isWeekend ? C.teal : C.muted, fontWeight: isWeekend ? 700 : 400, textAlign:'center' }}>
                {days[f.day] || f.day}
              </div>
              <div style={{ fontSize:9, color:'var(--text-muted)', textAlign:'center' }}>
                {f.date.slice(5)}
              </div>
            </div>
          )
        })}
      </div>
      {/* Légende */}
      <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
          <div style={{ width:12, height:12, borderRadius:2, background:C.teal }} />
          Prévision (vendredi-dimanche)
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
          <div style={{ width:12, height:12, borderRadius:2, background:'rgba(0,196,140,0.65)' }} />
          Prévision (semaine)
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.muted }}>
          <div style={{ width:24, height:8, borderRadius:2, background:'rgba(0,196,140,0.12)', border:'1px dashed rgba(0,196,140,0.4)' }} />
          Intervalle confiance
        </div>
      </div>
    </div>
  )
}

function MAPEGauge({ mape }: { mape: number }) {
  const score = mape < 5 ? '🏆 Excellent' : mape < 10 ? '✅ Très bon' : mape < 15 ? '👍 Bon' : '⚠️ À améliorer'
  const color = mape < 5 ? 'var(--success)' : mape < 10 ? C.teal : mape < 15 ? C.amber : C.red
  const pct = Math.min(100, (mape / 20) * 100)

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:900, color }}>{mape}%</div>
      <div style={{ fontSize:11, color:C.muted, margin:'4px 0' }}>MAPE (erreur moyenne)</div>
      <div style={{ height:6, background:'var(--border-color)', borderRadius:3, overflow:'hidden', margin:'8px 0' }}>
        <div style={{ height:'100%', width:`${100-pct}%`, background:color, borderRadius:3, transition:'width 1s' }} />
      </div>
      <div style={{ fontSize:12, fontWeight:700, color }}>{score}</div>
    </div>
  )
}

export default function ForecastsPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant()
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [horizon, setHorizon]   = useState(14)
  const [error, setError]       = useState('')
  const [refreshing, setRefresh] = useState(false)

  async function load(h = horizon) {
    if (!restaurant || !token) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`/api/v1/forecasts?horizon=${h}&restaurant_id=${restaurant.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setData(d)
    } catch(e: any) {
      setError(e.message || 'Erreur de chargement')
    }
    setLoading(false)
    setRefresh(false)
  }

  useEffect(() => { load() }, [restaurant?.id])

  function changeHorizon(h: number) {
    setHorizon(h)
    load(h)
  }

  const bestDay   = data?.forecasts?.reduce((a: any, b: any) => a.revenue_tnd > b.revenue_tnd ? a : b, {})
  const worstDay  = data?.forecasts?.reduce((a: any, b: any) => a.revenue_tnd < b.revenue_tnd ? a : b, {})
  const totalRev  = data?.forecasts?.reduce((s: number, f: any) => s + f.revenue_tnd, 0)
  const avgCovers = data?.forecasts ? Math.round(data.forecasts.reduce((s: number, f: any) => s + f.covers, 0) / data.forecasts.length) : 0

  const days = { Monday:'Lun', Tuesday:'Mar', Wednesday:'Mer', Thursday:'Jeu', Friday:'Ven', Saturday:'Sam', Sunday:'Dim' } as any

  return (
    <div style={{ maxWidth:1100 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>
            🧠 Prévisions <span style={{ color:C.teal }}>Prophet IA</span>
          </h1>
          <div style={{ fontSize:13, color:C.muted }}>
            Modèle entraîné sur {data?.stats?.training_days || '—'} jours · 
            {data?.stats?.data_start} → {data?.stats?.data_end}
          </div>
        </div>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
        {/* Horizon selector */}
        <div style={{ display:'flex', gap:6 }}>
          {[7, 14, 21, 30].map(h => (
            <button key={h} onClick={() => changeHorizon(h)} style={{
              padding:'7px 14px', borderRadius:8, border:'1px solid',
              borderColor: horizon===h ? C.teal : C.navyL,
              background: horizon===h ? C.teal : C.navyM,
              color: horizon===h ? C.navyD : C.muted,
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif'
            }}>J+{h}</button>
          ))}
          <button onClick={() => { setRefresh(true); load() }} style={{
            padding:'7px 14px', borderRadius:8, border:`1px solid ${C.navyL}`,
            background:C.navyM, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'Inter,sans-serif'
          }}>
            {refreshing ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(232,69,69,.12)', border:'1px solid var(--danger)', borderRadius:10, padding:'12px 16px', color:'var(--danger)', marginBottom:20, fontSize:14 }}>
          ❌ {error} — <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={() => load()}>Réessayer</span>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:16 }}>
          <div style={{ width:48, height:48, border:`4px solid ${C.navyL}`, borderTopColor:C.teal, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
          <div style={{ color:C.muted, fontSize:14 }}>Entraînement du modèle Prophet...</div>
          <div style={{ color:'var(--text-muted)', fontSize:12 }}>Cela peut prendre 30-60 secondes</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : data && (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:12, padding:16, borderTop:`2px solid ${C.teal}` }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Horizon</div>
              <div style={{ fontSize:22, fontWeight:800 }}>J+{horizon}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Prophet v1.3.0</div>
            </div>
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:12, padding:16, borderTop:'2px solid var(--info)' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>CA total prévu</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{totalRev?.toLocaleString('fr-FR')} TND</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{horizon} jours</div>
            </div>
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:12, padding:16, borderTop:'2px solid var(--warning)' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Pic prévu</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.teal }}>{bestDay?.revenue_tnd?.toLocaleString('fr-FR')} TND</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{days[bestDay?.day]} {bestDay?.date?.slice(5)}</div>
            </div>
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:12, padding:16, borderTop:'2px solid var(--success)' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Moy. couverts/jour</div>
              <div style={{ fontSize:22, fontWeight:800 }}>{avgCovers}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Ticket moyen ~50 TND</div>
            </div>
          </div>

          {/* Graphe principal */}
          <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:24, marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>📊 Prévisions CA — J+{horizon}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Réalisé vs Prévision Prophet · Intervalles de confiance 95%</div>
              </div>
              <div style={{ background:'var(--bg-page)', border:'1px solid var(--border-color)', borderRadius:8, padding:'6px 12px', fontSize:11, color:C.teal, fontWeight:700 }}>
                🔴 Live · {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>
            <BarChart forecasts={data.forecasts} />
          </div>

          {/* Tableau détaillé + MAPE */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:16, marginBottom:20 }}>
            {/* Tableau */}
            <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📋 Détail jour par jour</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {/* Header */}
                <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr 60px', gap:8, fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.5, paddingBottom:8, borderBottom:'1px solid var(--border-color)' }}>
                  <span>Date</span><span>CA prévu</span><span>Min — Max</span><span>Couverts</span><span>Jour</span>
                </div>
                {data.forecasts.map((f: any, i: number) => {
                  const isWeekend = ['Friday','Saturday','Sunday'].includes(f.day)
                  const isToday   = f.date === new Date().toISOString().slice(0, 10)
                  return (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr 60px', gap:8,
                      padding:'8px 6px', borderRadius:7, fontSize:12,
                      background: isToday ? 'rgba(0,196,140,.08)' : i%2===0 ? 'transparent' : 'var(--bg-card-alt)',
                      border: isToday ? '1px solid rgba(0,196,140,.25)' : '1px solid transparent'
                    }}>
                      <span style={{ color: isToday ? C.teal : C.muted, fontWeight: isToday ? 700 : 400 }}>
                        {isToday ? '▶ ' : ''}{f.date.slice(5)}
                      </span>
                      <span style={{ fontWeight:700, color: isWeekend ? C.teal : 'var(--text-primary)' }}>
                        {f.revenue_tnd.toLocaleString('fr-FR')} TND
                      </span>
                      <span style={{ color:C.muted }}>
                        {f.revenue_min.toLocaleString('fr-FR')} — {f.revenue_max.toLocaleString('fr-FR')}
                      </span>
                      <span style={{ color:'var(--text-secondary)' }}>{f.covers} cvts</span>
                      <span style={{ color: isWeekend ? C.teal : C.muted, fontWeight: isWeekend ? 700 : 400 }}>
                        {days[f.day] || f.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Qualité modèle */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🎯 Qualité du modèle</div>
                <MAPEGauge mape={data.mape || 0} />
              </div>

              <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📊 Dataset</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { lbl:'Jours entraînement', val:`${data.stats?.training_days}j` },
                    { lbl:'CA moyen/jour', val:`${data.stats?.avg_revenue?.toLocaleString('fr-FR')} TND` },
                    { lbl:'Début données', val:data.stats?.data_start },
                    { lbl:'Fin données', val:data.stats?.data_end },
                    { lbl:'Modèle', val:'Prophet v1.3.0' },
                    { lbl:'Saisonnalité', val:'Hebdo + Mensuel' },
                    { lbl:'Jours fériés', val:'Tunisie + Ramadan' },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, paddingBottom:6, borderBottom:'1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}>
                      <span style={{ color:C.muted }}>{item.lbl}</span>
                      <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:C.navyM, border:`1px solid rgba(0,196,140,.25)`, borderRadius:14, padding:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:8 }}>💡 Recommandation</div>
                <div style={{ fontSize:11, color:C.gray, lineHeight:1.6 }}>
                  {bestDay?.day === 'Saturday' || bestDay?.day === 'Friday'
                    ? `Le ${days[bestDay?.day]} est votre meilleur jour prévu. Assurez-vous d'avoir suffisamment de stock et de personnel.`
                    : `Préparez vos stocks en priorité pour le ${days[bestDay?.day]} — votre pic de CA cette semaine.`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Saisonnalité */}
          <div style={{ background:C.navyM, border:'1px solid var(--border-color)', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📅 Saisonnalité hebdomadaire détectée</div>
            <div style={{ display:'flex', gap:8 }}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                const dayData = data.forecasts?.find((f: any) => f.day === day)
                const maxRev  = Math.max(...(data.forecasts || []).map((f: any) => f.revenue_tnd))
                const pct     = dayData ? (dayData.revenue_tnd / maxRev) * 100 : 0
                const isWeekend = ['Friday','Saturday','Sunday'].includes(day)
                return (
                  <div key={day} style={{ flex:1, textAlign:'center' }}>
                    <div style={{ height:80, display:'flex', alignItems:'flex-end', justifyContent:'center', marginBottom:6 }}>
                      <div style={{ width:'70%', borderRadius:'3px 3px 0 0', height:`${pct}%`, background: isWeekend ? C.teal : 'rgba(0,196,140,0.5)', minHeight:4, transition:'height .5s' }} />
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color: isWeekend ? C.teal : C.muted }}>{days[day]}</div>
                    {dayData && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{Math.round(dayData.revenue_tnd/1000)}k</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
