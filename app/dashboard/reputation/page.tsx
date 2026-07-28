'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function ReputationPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1]
    if (token) api.reputation(token).then(setData)
  }, [])

  const totalAvis: number = data?.platforms
    ? Object.values(data.platforms).reduce((a: number, p: any) => a + (p.count as number), 0)
    : 0

  const kpis = [
    { label:'Note globale', value: data?.global_rating ? `${data.global_rating}/5` : '—', color:'#F5A623' },
    { label:'Total avis',   value: totalAvis > 0 ? String(totalAvis) : '—',               color:'#00C48C' },
    { label:'Taux réponse', value: '94%',                                                  color:'#27AE60' },
    { label:'Réponses IA',  value: '78%',                                                  color:'#8B5CF6' },
  ]

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>⭐ Réputation & <span style={{ color:'#00C48C' }}>Avis clients</span></h1>
      <div style={{ fontSize:13, color:'#6A8FAB', marginBottom:24 }}>Google Maps · Facebook · TripAdvisor · Réponses IA automatiques</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {kpis.map((k,i) => (
          <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'#6A8FAB', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { name:'Google Maps', icon:'🗺️', key:'google'      },
          { name:'Facebook',    icon:'📘', key:'facebook'    },
          { name:'TripAdvisor', icon:'🦉', key:'tripadvisor' },
        ].map((p,i) => {
          const pl = data?.platforms?.[p.key]
          return (
            <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{p.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>{p.name}</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#F5A623' }}>{pl?.rating ?? '—'}/5</div>
              <div style={{ fontSize:12, color:'#6A8FAB', marginTop:4 }}>{pl?.count?.toLocaleString('fr-FR') ?? '—'} avis</div>
              <div style={{ fontSize:11, color:'#00C48C', marginTop:8 }}>+12 ce mois</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
