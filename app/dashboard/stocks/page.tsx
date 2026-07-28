'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function StocksPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1]
    if (token) api.stocks(token).then(setData)
  }, [])

  const statusColors: any = { RUPTURE:'#E84545', CRITIQUE:'#F5A623', DLC_ALERT:'#F5A623', OK:'#00C48C' }

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>📦 Gestion des <span style={{ color:'#00C48C' }}>stocks</span></h1>
      <div style={{ fontSize:13, color:'#6A8FAB', marginBottom:24 }}>Inventaire temps réel · Alertes DLC · Food cost</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Valeur stock', value:`${data?.valuation_tnd?.toLocaleString('fr-FR')} TND`, color:'#00C48C' },
          { label:'Ruptures', value: data?.items?.filter((i:any)=>i.status==='RUPTURE').length ?? '—', color:'#E84545' },
          { label:'DLC < 48h', value: data?.items?.filter((i:any)=>i.status==='DLC_ALERT').length ?? '—', color:'#F5A623' },
          { label:'Articles OK', value: data?.items?.filter((i:any)=>i.status==='OK').length ?? '—', color:'#27AE60' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'#6A8FAB', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Inventaire complet</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data?.items?.map((item: any, i: number) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#081522', borderRadius:8 }}>
              <div style={{ flex:1, fontSize:13, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:13, fontWeight:700, color:statusColors[item.status], width:80, textAlign:'right' }}>{item.qty} {item.unit}</div>
              <div style={{ width:120, height:5, background:'#1A3A52', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${item.pct}%`, background:statusColors[item.status], borderRadius:3 }}></div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:`${statusColors[item.status]}20`, color:statusColors[item.status], width:90, textAlign:'center' }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
