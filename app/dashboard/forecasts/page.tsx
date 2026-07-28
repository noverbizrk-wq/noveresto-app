'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function ForecastsPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1]
    if (token) api.forecasts(token).then(setData)
  }, [])

  const max = Math.max(...(data?.forecasts?.map((f:any) => f.revenue_tnd) || [1]))

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>🧠 Prévisions <span style={{ color:'#00C48C' }}>IA J+14</span></h1>
      <div style={{ fontSize:13, color:'#6A8FAB', marginBottom:24 }}>{data?.model}</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Précision modèle', value:'93.7%',   color:'#00C48C' },
          { label:'MAPE',            value:'6.3%',    color:'#3B82F6' },
          { label:'Horizon',         value:'J+14',    color:'#8B5CF6' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'#6A8FAB', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Prévisions J+7</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data?.forecasts?.map((f: any, i: number) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:70, fontSize:12, color: i===0 ? '#00C48C' : '#6A8FAB', fontWeight: i===0 ? 700 : 400 }}>{i===0?'▶ ':''}{f.date}</div>
              <div style={{ flex:1, height:6, background:'#1A3A52', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(f.revenue_tnd/max)*100}%`, background: i===0 ? '#00C48C' : '#3B82F6', borderRadius:3 }}></div>
              </div>
              <div style={{ width:90, fontSize:12, fontWeight:700, color: i===0 ? '#00C48C' : '#fff', textAlign:'right' }}>{f.revenue_tnd.toLocaleString('fr-FR')} TND</div>
              <div style={{ width:60, fontSize:11, color:'#6A8FAB', textAlign:'right' }}>{f.covers} cvts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
