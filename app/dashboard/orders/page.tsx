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
    DRAFT:     { bg:'color-mix(in srgb, var(--info) 20%, transparent)', color:'var(--info)', label:'EN ATTENTE' },
    SENT:      { bg:'color-mix(in srgb, var(--warning) 20%, transparent)', color:'var(--warning)', label:'ENVOYÉ'     },
    CONFIRMED: { bg:'color-mix(in srgb, var(--success) 20%, transparent)', color:'var(--success)', label:'LIVRÉ ✅'   },
  }

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>🛒 Commandes <span style={{ color:'var(--accent)' }}>automatiques</span></h1>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Bons de commande générés par l'IA · Envoi auto fournisseurs</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'En attente', value: data?.orders?.filter((o:any)=>o.status==='DRAFT').length ?? '—', color:'var(--warning)' },
          { label:'Total à valider', value:'1 840 TND', color:'var(--accent)' },
          { label:'Livrées ce mois', value: data?.orders?.filter((o:any)=>o.status==='CONFIRMED').length ?? '—', color:'var(--success)' },
        ].map((k,i) => (
          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:16, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.color }}></div>
            <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Bons de commande — Générés par IA</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data?.orders?.map((o: any, i: number) => {
            const s = statusStyle[o.status] || statusStyle.DRAFT
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--bg-page)', borderRadius:10 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', width:80 }}>{o.id}</div>
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
