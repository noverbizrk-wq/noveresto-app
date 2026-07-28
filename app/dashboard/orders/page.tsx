'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function OrdersPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1]
    if (token) api.orders(token).then(setData)
  }, [])

  const statusStyle: any = {
    DRAFT:     { bg:'#3B82F620', color:'#3B82F6', label:'EN ATTENTE' },
    SENT:      { bg:'#F5A62320', color:'#F5A623', label:'ENVOYÉ'     },
    CONFIRMED: { bg:'#27AE6020', color:'#27AE60', label:'LIVRÉ ✅'   },
  }

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>🛒 Commandes <span style={{ color:'#00C48C' }}>automatiques</span></h1>
      <div style={{ fontSize:13, color:'#6A8FAB', marginBottom:24 }}>Bons de commande générés par l'IA · Envoi auto fournisseurs</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'En attente', value: data?.orders?.filter((o:any)=>o.status==='DRAFT').length ?? '—', color:'#F5A623' },
          { label:'Total à valider', value:'1 840 TND', color:'#00C48C' },
          { label:'Livrées ce mois', value: data?.orders?.filter((o:any)=>o.status==='CONFIRMED').length ?? '—', color:'#27AE60' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'#6A8FAB', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#0F2D40', border:'1px solid #1A3A52', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Bons de commande — Générés par IA</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data?.orders?.map((o: any, i: number) => {
            const s = statusStyle[o.status] || statusStyle.DRAFT
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#081522', borderRadius:10 }}>
                <div style={{ fontSize:12, color:'#6A8FAB', width:80 }}>{o.id}</div>
                <div style={{ flex:1, fontSize:13, fontWeight:700 }}>{o.supplier}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{o.total.toLocaleString('fr-FR')} TND</div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:10, background:s.bg, color:s.color }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
