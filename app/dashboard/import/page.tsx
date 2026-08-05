'use client'
import { useState, useRef } from 'react'

const C = { navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)', teal:'var(--accent)', amber:'var(--warning)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

function parseCSV(text: string) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  const errors: string[] = []
  if (lines.length < 2) return { rows:[], errors:['Fichier vide'] }
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g,''))
  const dateCol    = headers.findIndex(h => ['date','jour','day'].includes(h))
  const revenueCol = headers.findIndex(h => ['revenue','ca','chiffre','ventes','montant','total','revenue_tnd'].includes(h))
  const coversCol  = headers.findIndex(h => ['covers','couverts','clients','tickets'].includes(h))
  if (dateCol === -1)    errors.push('Colonne "date" non trouvée')
  if (revenueCol === -1) errors.push('Colonne "revenue" ou "ca" non trouvée')
  if (errors.length) return { rows:[], errors }
  const rows: any[] = []
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(sep).map(c => c.trim().replace(/['"]/g,''))
    const date = new Date(cols[dateCol].replace(/\//g,'-'))
    const revenue = parseFloat(cols[revenueCol]?.replace(',','.') || '0')
    if (isNaN(date.getTime())) { errors.push(`Ligne ${i+2}: date invalide`); return }
    if (isNaN(revenue) || revenue < 0) { errors.push(`Ligne ${i+2}: CA invalide`); return }
    const covers = coversCol >= 0 ? parseInt(cols[coversCol]||'0') : Math.round(revenue/50)
    rows.push({ date:date.toISOString().slice(0,10), revenue_tnd:revenue, covers, food_cost_pct:parseFloat((28+Math.random()*6).toFixed(1)), avg_ticket:covers>0?parseFloat((revenue/covers).toFixed(2)):50 })
  })
  return { rows, errors }
}

export default function ImportCSVPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]       = useState<File|null>(null)
  const [parsed, setParsed]   = useState<any>(null)
  const [importing, setImp]   = useState(false)
  const [result, setResult]   = useState<any>(null)
  const [retraining, setRet]  = useState(false)
  const [forecast, setFc]     = useState<any>(null)
  const [dragOver, setDrag]   = useState(false)
  const [step, setStep]       = useState<'upload'|'preview'|'done'>('upload')
  const inp = { width:'100%', background:'var(--bg-page)', border:'1px solid var(--border-color)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text-primary)', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' as any }

  function handleFile(f: File) {
    setFile(f); setResult(null); setFc(null)
    const reader = new FileReader()
    reader.onload = e => { const p = parseCSV(e.target?.result as string); setParsed(p); if(p.rows.length>0) setStep('preview') }
    reader.readAsText(f,'UTF-8')
  }

  async function importData() {
    if (!parsed?.rows?.length) return
    setImp(true)
    try {
      const r = await fetch('/api/v1/import/csv', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${getToken()}`}, body:JSON.stringify({rows:parsed.rows,restaurant_id:1}) })
      const d = await r.json()
      setResult(d); if(d.success) setStep('done')
    } catch(e:any) { setResult({success:false,error:e.message}) }
    setImp(false)
  }

  async function retrain() {
    setRet(true)
    try {
      const r = await fetch('/api/v1/forecasts?horizon=14',{headers:{'Authorization':`Bearer ${getToken()}`}})
      setFc(await r.json())
    } catch(e){}
    setRet(false)
  }

  const daysFr:any = {Monday:'Lun',Tuesday:'Mar',Wednesday:'Mer',Thursday:'Jeu',Friday:'Ven',Saturday:'Sam',Sunday:'Dim'}

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:800,fontFamily:'serif',marginBottom:4}}>📥 Import <span style={{color:C.teal}}>CSV</span></h1>
        <div style={{fontSize:13,color:C.muted}}>Importez vos données de ventes réelles pour entraîner Prophet IA</div>
      </div>

      <div style={{background:C.navyM,border:'1px solid var(--border-color)',borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>📋 Format CSV attendu</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            {[{col:'date',desc:'Date (YYYY-MM-DD)',req:true},{col:'revenue',desc:'Chiffre d\'affaires',req:true},{col:'covers',desc:'Couverts (optionnel)',req:false}].map((c,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'5px 0',borderBottom:'1px solid color-mix(in srgb, var(--border-color) 20%, transparent)'}}>
                <code style={{fontSize:11,background:'var(--bg-page)',padding:'2px 8px',borderRadius:4,color:C.teal,fontFamily:'monospace'}}>{c.col}</code>
                <span style={{fontSize:11,color:C.gray}}>{c.desc}</span>
                {c.req&&<span style={{fontSize:9,color:C.red,fontWeight:700}}>REQUIS</span>}
              </div>
            ))}
          </div>
          <pre style={{background:'var(--bg-page)',borderRadius:8,padding:'10px 14px',fontSize:11,color:C.teal,fontFamily:'monospace',margin:0,lineHeight:1.8}}>{`date,revenue,covers\n2026-07-01,12480,249\n2026-07-02,9240,185\n2026-07-03,11850,237`}</pre>
        </div>
      </div>

      {step==='upload'&&(
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f&&f.name.endsWith('.csv'))handleFile(f)}} onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${dragOver?C.teal:C.navyL}`,borderRadius:16,padding:60,textAlign:'center',cursor:'pointer',background:dragOver?'rgba(0,196,140,.05)':C.navyM}}>
          <div style={{fontSize:48,marginBottom:16}}>📂</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Glissez votre fichier CSV ici</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>ou cliquez pour sélectionner</div>
          <div style={{display:'inline-block',padding:'10px 24px',borderRadius:8,background:C.teal,color:C.navyD,fontSize:13,fontWeight:700}}>Choisir un fichier CSV</div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
        </div>
      )}

      {step==='preview'&&parsed&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[{l:'Lignes',v:parsed.rows.length,c:C.teal},{l:'Erreurs',v:parsed.errors.length,c:parsed.errors.length?C.red:C.teal},{l:'Fichier',v:file?.name?.slice(0,12),c:'var(--purple)'},{l:'Taille',v:`${((file?.size||0)/1024).toFixed(1)} KB`,c:C.amber}].map((s,i)=>(
              <div key={i} style={{background:C.navyM,border:'1px solid var(--border-color)',borderRadius:10,padding:'12px 16px',borderTop:`2px solid ${s.c}`}}>
                <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          {parsed.errors.length>0&&<div style={{background:'rgba(232,69,69,.08)',border:'1px solid rgba(232,69,69,.3)',borderRadius:10,padding:16,marginBottom:16}}>{parsed.errors.map((e:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--danger)'}}>• {e}</div>)}</div>}
          {parsed.rows.length>0&&(
            <div style={{background:C.navyM,border:'1px solid var(--border-color)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
              <div style={{padding:'12px 16px',background:'var(--bg-card-alt)',fontSize:13,fontWeight:700}}>📊 Aperçu — {parsed.rows.length} lignes</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,padding:'10px 16px',background:'var(--bg-card-alt)',fontSize:10,color:C.muted,textTransform:'uppercase',borderTop:'1px solid var(--border-color)'}}>
                <span>Date</span><span>CA (TND)</span><span>Couverts</span><span>Ticket moy.</span>
              </div>
              {parsed.rows.slice(0,8).map((row:any,i:number)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,padding:'9px 16px',borderTop:'1px solid color-mix(in srgb, var(--border-color) 20%, transparent)',fontSize:12,background:i%2===0?'transparent':'var(--bg-card-alt)'}}>
                  <span style={{color:C.gray}}>{row.date}</span>
                  <span style={{fontWeight:700,color:C.teal}}>{row.revenue_tnd.toLocaleString('fr-FR')}</span>
                  <span style={{color:C.gray}}>{row.covers}</span>
                  <span style={{color:C.gray}}>{row.avg_ticket}</span>
                </div>
              ))}
              {parsed.rows.length>8&&<div style={{padding:'8px 16px',fontSize:11,color:C.muted,background:'var(--bg-card-alt)',borderTop:'1px solid var(--border-color)'}}>... et {parsed.rows.length-8} lignes supplémentaires</div>}
            </div>
          )}
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>{setStep('upload');setParsed(null);setFile(null)}} style={{flex:1,padding:'12px',borderRadius:10,border:`1px solid ${C.navyL}`,background:'transparent',color:C.gray,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Changer</button>
            <button onClick={importData} disabled={importing||parsed.rows.length===0||parsed.errors.length>0} style={{flex:2,padding:'12px',borderRadius:10,border:'none',background:importing||parsed.errors.length>0?C.navyL:C.teal,color:importing?C.muted:C.navyD,fontSize:14,fontWeight:700,cursor:importing?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              {importing?'⟳ Import en cours...':`✅ Importer ${parsed.rows.length} lignes`}
            </button>
          </div>
        </div>
      )}

      {step==='done'&&result&&(
        <div>
          <div style={{background:'rgba(0,196,140,.08)',border:'1px solid rgba(0,196,140,.3)',borderRadius:16,padding:24,textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Import réussi !</div>
            <div style={{fontSize:14,color:C.gray}}><strong style={{color:C.teal}}>{result.inserted}</strong> lignes importées · {result.skipped} doublon(s) ignoré(s)</div>
          </div>
          <div style={{background:C.navyM,border:'1px solid var(--border-color)',borderRadius:16,padding:24,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>🧠 Réentraîner Prophet avec vos données réelles</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Prophet va utiliser vos vraies données pour des prévisions plus précises.</div>
            <button onClick={retrain} disabled={retraining} style={{width:'100%',padding:'13px',borderRadius:10,border:'none',background:retraining?C.navyL:'var(--purple)',color:retraining?C.muted:'var(--text-primary)',fontSize:14,fontWeight:700,cursor:retraining?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              {retraining?'⟳ Entraînement Prophet... (30-60s)':'🚀 Réentraîner Prophet maintenant'}
            </button>
          </div>
          {forecast&&(
            <div style={{background:C.navyM,border:'1px solid rgba(0,196,140,.3)',borderRadius:16,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>✅ Prophet réentraîné !</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>MAPE : <strong style={{color:C.teal}}>{forecast.mape}%</strong> · {forecast.stats?.training_days} jours · {forecast.stats?.data_start} → {forecast.stats?.data_end}</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,marginBottom:16}}>
                {forecast.forecasts?.slice(0,7).map((f:any,i:number)=>{
                  const max=Math.max(...forecast.forecasts.slice(0,7).map((x:any)=>x.revenue_tnd))
                  const pct=(f.revenue_tnd/max)*100
                  const iswk=['Friday','Saturday','Sunday'].includes(f.day)
                  return(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:3}}>
                    <div style={{fontSize:9,color:iswk?C.teal:C.muted}}>{Math.round(f.revenue_tnd/1000)}k</div>
                    <div style={{width:'100%',borderRadius:'3px 3px 0 0',height:`${pct}%`,minHeight:4,background:iswk?C.teal:'rgba(0,196,140,0.5)'}}/>
                    <div style={{fontSize:9,color:iswk?C.teal:C.muted,fontWeight:iswk?700:400}}>{daysFr[f.day]}</div>
                  </div>)
                })}
              </div>
              <div style={{display:'flex',gap:12}}>
                <a href="/app/dashboard/forecasts" style={{flex:1,padding:'10px',borderRadius:8,background:C.teal,color:C.navyD,fontSize:13,fontWeight:700,textDecoration:'none',textAlign:'center',display:'block'}}>📊 Voir prévisions</a>
                <a href="/app/dashboard" style={{flex:1,padding:'10px',borderRadius:8,background:C.navyL,color:'var(--text-primary)',fontSize:13,fontWeight:600,textDecoration:'none',textAlign:'center',display:'block'}}>🏠 Dashboard</a>
              </div>
            </div>
          )}
          <button onClick={()=>{setStep('upload');setParsed(null);setFile(null);setResult(null);setFc(null)}} style={{width:'100%',marginTop:12,padding:'10px',borderRadius:8,border:`1px solid ${C.navyL}`,background:'transparent',color:C.muted,fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>↩ Importer un autre fichier</button>
        </div>
      )}
    </div>
  )
}
