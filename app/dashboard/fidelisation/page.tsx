'use client'
export default function FidelisationPage() {
  const promos = [
    { icon:'📍', title:'Géofencing 300m',  desc:'Push si client à moins de 300m · −10%',      color:'var(--info)' },
    { icon:'🌙', title:'Promo Ramadan',     desc:'Offre Iftar auto à 18h30 aux clients fidèles', color:'var(--warning)' },
    { icon:'🎂', title:'Anniversaire',      desc:'Dessert offert le jour J · Taux visite 78%',   color:'var(--accent)' },
    { icon:'🔄', title:'Win-back −20%',     desc:'Client absent 21j · Réactivation 34%',         color:'var(--danger)' },
  ]
  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>♥ Fidélisation <span style={{ color:'var(--accent)' }}>clients</span></h1>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Programme de points · Géofencing · Win-back automatique</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Clients inscrits', value:'847',    color:'var(--accent)' },
          { label:'Clients VIP',      value:'124',    color:'var(--warning)' },
          { label:'Taux de retour',   value:'68%',    color:'var(--success)' },
          { label:'Dépense fidèle',   value:'82 TND', color:'var(--info)' },
        ].map((k,i) => (
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
          {[
            { icon:'🥉', name:'Découvreur', pts:'0–199 pts', count:423, avantage:'5% remise · Burger anniversaire', color:'#8B6A3A' },
            { icon:'🥈', name:'Habitué',    pts:'200–499 pts', count:300, avantage:'10% remise · Livraison offerte', color:'var(--text-secondary)' },
            { icon:'🥇', name:'VIP',        pts:'500+ pts',  count:124, avantage:'15% remise + dessert · Table prioritaire', color:'var(--warning)' },
          ].map((l,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-page)', borderRadius:10, marginBottom:8, border:`1px solid ${l.color}40` }}>
              <div style={{ fontSize:24 }}>{l.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:l.color }}>{l.name} · {l.pts}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{l.avantage}</div>
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:l.color }}>{l.count}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🎯 Promos intelligentes</div>
          {promos.map((p,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'10px 14px', background:'var(--bg-page)', borderRadius:10, marginBottom:8, alignItems:'center' }}>
              <div style={{ fontSize:22 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:p.color }}>{p.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{p.desc}</div>
              </div>
              <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
