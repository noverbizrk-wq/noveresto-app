'use client'
export default function SocialPage() {
  const platforms = [
    { name:'TikTok', icon:'🎵', followers:4280, growth:'+12%', color:'#FF0050' },
    { name:'Instagram', icon:'📸', followers:2847, growth:'+8%', color:'#E1306C' },
    { name:'Facebook', icon:'📘', followers:1923, growth:'+5%', color:'#1877F2' },
  ]
  const planning = [
    { day:'Lun', type:'Story', platform:'Instagram', color:'#E1306C', time:'11h' },
    { day:'Mar', type:'Reel',  platform:'TikTok',    color:'#FF0050', time:'18h' },
    { day:'Mer', type:'Post',  platform:'Facebook',  color:'#1877F2', time:'19h' },
    { day:'Jeu', type:'Reel',  platform:'TikTok',    color:'#FF0050', time:'18h' },
    { day:'Ven', type:'Story', platform:'Instagram', color:'#E1306C', time:'20h' },
    { day:'Sam', type:'Reel',  platform:'TikTok',    color:'#FF0050', time:'19h' },
    { day:'Dim', type:'Post',  platform:'Facebook',  color:'#1877F2', time:'12h' },
  ]
  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, fontFamily:'serif', marginBottom:4 }}>📲 Social Media <span style={{ color:'var(--accent)' }}>IA</span></h1>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Planning éditorial automatique · TikTok · Instagram · Facebook</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {platforms.map((p,i) => (
          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20, textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:p.color }}></div>
            <div style={{ fontSize:32, marginBottom:8 }}>{p.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>{p.name}</div>
            <div style={{ fontSize:28, fontWeight:800 }}>{p.followers.toLocaleString('fr-FR')}</div>
            <div style={{ fontSize:12, color:p.color, marginTop:4 }}>{p.growth} ce mois</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>📅 Planning éditorial IA — Cette semaine</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {planning.map((p,i) => (
            <div key={i}>
              <div style={{ background:'var(--border-color)', borderRadius:6, padding:'4px 6px', textAlign:'center', fontSize:11, fontWeight:700, marginBottom:6 }}>{p.day}</div>
              <div style={{ background:'var(--bg-page)', border:`1px solid ${p.color}50`, borderRadius:6, padding:'8px 4px', textAlign:'center' }}>
                <div style={{ fontSize:10, color:p.color, fontWeight:700 }}>{p.type}</div>
                <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>{p.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
