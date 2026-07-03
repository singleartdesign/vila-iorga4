'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']
const CULORI_LIGHT = ['rgba(224,123,57,0.25)','rgba(37,99,168,0.25)','rgba(5,150,105,0.25)','rgba(124,58,237,0.25)','rgba(185,28,28,0.25)']

function MiniBarChart({ data, valueKey, color, colorLight, unit, height=140 }) {
  const vals = data.map(d => d[valueKey] || 0)
  const maxVal = Math.max(...vals, 1)
  const minVal = Math.max(0, Math.min(...vals.filter(v=>v>0)) * 0.7)
  const range = maxVal - minVal || 1

  return (
    <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
      <div style={{display:'flex', alignItems:'flex-end', gap:6, height, minWidth: data.length * 42, padding:'4px 4px 0'}}>
        {data.map((item, i) => {
          const val = item[valueKey] || 0
          const h = val > 0 ? Math.max(((val - minVal) / range) * (height - 36), 8) : 0
          const isLast = i === data.length - 1
          return (
            <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:34, flex:1}}>
              <div style={{fontSize:9, fontWeight:700, height:14, display:'flex', alignItems:'flex-end',
                color: isLast ? color : 'var(--text3)'}}>
                {isLast ? (unit === 'RON' ? Math.round(val) : val) : ''}
              </div>
              <div style={{
                width:26, borderRadius:'5px 5px 0 0',
                background: isLast ? color : colorLight,
                height: h, minHeight: val > 0 ? 4 : 0,
                transition:'height 0.3s'
              }}></div>
              <div style={{fontSize:9, color:'var(--text3)', fontWeight:600, textAlign:'center', lineHeight:1.2}}>
                {LUNI_NUME[item.luna]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProprietarChart({ luni, citiri, apartamente, height=160 }) {
  if (!luni.length || !apartamente.length) return null
  const allConsumuri = citiri.map(c => c.consum || 0).filter(v => v > 0)
  const maxVal = Math.max(...allConsumuri, 1)

  return (
    <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
      <div style={{display:'flex', alignItems:'flex-end', gap:4, height, minWidth: luni.length * 52, padding:'4px 4px 0'}}>
        {luni.map((luna, li) => {
          const citiriLuna = citiri.filter(c => c.luna_id === luna.id)
          const isLast = li === luni.length - 1
          return (
            <div key={luna.id} style={{display:'flex', flexDirection:'column', alignItems:'center', flex:1, minWidth:46}}>
              <div style={{display:'flex', alignItems:'flex-end', gap:2, flex:1, width:'100%'}}>
                {apartamente.map((apt, ai) => {
                  const citire = citiriLuna.find(c => c.apartament_id === apt.id)
                  const consum = citire?.consum || 0
                  const h = Math.max((consum / maxVal) * (height - 30), consum > 0 ? 4 : 0)
                  return (
                    <div key={apt.id} style={{
                      flex:1, borderRadius:'3px 3px 0 0',
                      background: isLast ? CULORI[ai%5] : CULORI_LIGHT[ai%5],
                      height: h
                    }}/>
                  )
                })}
              </div>
              <div style={{fontSize:8, color: isLast ? 'var(--t1)' : 'var(--text3)', fontWeight:700, marginTop:3, textAlign:'center'}}>
                {LUNI_NUME[luna.luna]}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex', gap:10, marginTop:8, flexWrap:'wrap'}}>
        {apartamente.map((apt, i) => (
          <div key={apt.id} style={{display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text3)'}}>
            <div style={{width:10, height:10, borderRadius:2, background:CULORI[i%5]}}></div>
            {apt.proprietar_nume.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [lunaActuala, setLunaActuala] = useState(null)
  const [citiri, setCitiri] = useState([])
  const [plati, setPlati] = useState([])
  const [calcule, setCalcule] = useState([])
  const [istoricLuni, setIstoricLuni] = useState([])
  const [istoricCitiri, setIstoricCitiri] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data: luni } = await supabase.from('luni_facturare').select('*').order('an', { ascending: false }).order('luna', { ascending: false }).limit(12)
    if (luni && luni.length > 0) {
      setLunaActuala(luni[0])
      setIstoricLuni([...luni].reverse())
      const { data: cit } = await supabase.from('citiri').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', luni[0].id)
      const { data: calc } = await supabase.from('calcule_lunare').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', luni[0].id)
      const { data: pl } = await supabase.from('plati').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', luni[0].id)
      setCitiri(cit || [])
      setCalcule(calc || [])
      setPlati(pl || [])
      const lunaIds = luni.map(l => l.id)
      const { data: citIst } = await supabase.from('citiri').select('*, apartamente(numar, proprietar_nume)').in('luna_id', lunaIds)
      setIstoricCitiri(citIst || [])
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',fontFamily:'Nunito,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>💧</div>
        <div style={{color:'var(--text3)',fontWeight:600}}>Se incarca datele...</div>
      </div>
    </div>
  )

  const totalFactura = lunaActuala?.valoare_factura || 0
  const totalColectat = plati.reduce((s,p) => s + (p.suma_platita || 0), 0)
  const totalRestant = plati.reduce((s,p) => s + Math.max(0, (p.suma_calculata || 0) - (p.suma_platita || 0)), 0)
  const pierdere = lunaActuala ? lunaActuala.consum_facturat - citiri.reduce((s,c) => s + (c.consum || 0), 0) : 0
  const nrRestante = plati.filter(p => (p.suma_calculata || 0) > (p.suma_platita || 0)).length
  const lunaNume = lunaActuala ? `${LUNI_NUME[lunaActuala.luna]} ${lunaActuala.an}` : ''

  const apartamente = [...new Map(istoricCitiri.map(c => [c.apartament_id, c.apartamente])).values()]
    .filter(Boolean).sort((a,b) => a.numar - b.numar)

  const consumData = istoricLuni.map(l => ({ luna: l.luna, an: l.an, consum_facturat: l.consum_facturat }))
  const valoareData = istoricLuni.map(l => ({ luna: l.luna, an: l.an, valoare_factura: l.valoare_factura }))

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif'}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>💧</span>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Vila Iorga 4</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>Administrare apa</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{textAlign:'right'}}>
            <div style={{color:'#fff',fontSize:13,fontWeight:700}}>{profile?.nume}</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:10,textTransform:'capitalize'}}>{profile?.rol}</div>
          </div>
          <button onClick={handleLogout} style={{padding:'6px 12px',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>Iesi</button>
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid var(--border)',display:'flex',overflowX:'auto',padding:'0 10px'}}>
        {[
          {label:'Dashboard',icon:'📊',href:'/dashboard'},
          {label:'Citiri',icon:'🔢',href:'/dashboard/citiri'},
          {label:'Facturi',icon:'📄',href:'/dashboard/facturi'},
          {label:'Plati',icon:'💳',href:'/dashboard/plati'},
          {label:'Rapoarte',icon:'📋',href:'/dashboard/rapoarte'},
          {label:'Setari',icon:'⚙️',href:'/dashboard/setari'},
        ].map(tab => (
          <a key={tab.href} href={tab.href} style={{
            display:'flex',alignItems:'center',gap:5,padding:'11px 14px',
            fontSize:12,fontWeight:700,
            color:tab.href==='/dashboard'?'var(--t1)':'var(--text3)',
            borderBottom:tab.href==='/dashboard'?'2.5px solid var(--t1)':'2.5px solid transparent',
            textDecoration:'none',whiteSpace:'nowrap'
          }}>{tab.icon} {tab.label}</a>
        ))}
      </div>

      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12,maxWidth:900,margin:'0 auto'}}>

        {lunaActuala && (
          <div style={{background:'linear-gradient(135deg,var(--t7),var(--l7))',border:'1.5px solid var(--t5)',borderRadius:'var(--r)',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,marginBottom:3}}>LUNA CURENTA</div>
              <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Sora,sans-serif'}}>{lunaNume}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{lunaActuala.consum_facturat} mc · {lunaActuala.pret_per_mc?.toFixed(2)} RON/mc</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:'var(--l2)',fontFamily:'Sora,sans-serif'}}>{totalFactura.toFixed(2)}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>RON total factura</div>
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {[
            {label:'Colectat',val:totalColectat.toFixed(0),unit:'RON',color:'var(--t1)'},
            {label:'Restante',val:totalRestant.toFixed(0),unit:'RON',color:nrRestante>0?'#f97316':'var(--t1)'},
            {label:'Pierdere apa',val:Math.abs(pierdere).toFixed(2),unit:'mc',color:'#f97316'},
            {label:'Citiri',val:`${citiri.length}/5`,unit:'introduse',color:'var(--l2)'},
          ].map(s => (
            <div key={s.label} style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'Sora,sans-serif'}}>{s.val} <span style={{fontSize:12,color:'var(--text3)',fontWeight:500}}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Situatie plati - {lunaNume}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {calcule.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'20px 0',fontSize:13}}>Nu exista calcule pentru luna aceasta.</div>
            ) : calcule.sort((a,b) => a.apartamente.numar - b.apartamente.numar).map((calc, i) => {
              const plata = plati.find(p => p.apartament_id === calc.apartament_id)
              const platit = plata?.suma_platita || 0
              const rest = Math.max(0, calc.suma_calculata - platit)
              const status = rest === 0 ? 'platit' : platit > 0 ? 'partial' : 'neplatit'
              const culori = {platit:{border:'var(--t2)',text:'var(--t1)',label:'Platit'},partial:{border:'var(--l4)',text:'var(--l2)',label:'Partial'},neplatit:{border:'#fed7aa',text:'#f97316',label:'Neplatit'}}
              const c = culori[status]
              return (
                <div key={calc.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--bg)',borderRadius:'var(--r-sm)',borderLeft:`3px solid ${c.border}`}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:CULORI[i%5],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12,flexShrink:0}}>
                    {calc.apartamente.proprietar_nume.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{calc.apartamente.proprietar_nume}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>Ap. {calc.apartamente.numar} · {calc.mc_de_plata?.toFixed(2)} mc</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:c.text,fontFamily:'Sora,sans-serif'}}>{calc.suma_calculata?.toFixed(2)} RON</div>
                    <div style={{fontSize:10,fontWeight:700,color:c.text}}>{c.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {istoricLuni.length > 0 && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700}}>Consum facturat - 12 luni (mc)</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>scroll →</div>
            </div>
            <MiniBarChart data={consumData} valueKey="consum_facturat" color="var(--t1)" colorLight="rgba(20,184,166,0.2)" unit="mc" />
          </div>
        )}

        {istoricLuni.length > 0 && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700}}>Valoare facturi - 12 luni (RON)</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>scroll →</div>
            </div>
            <MiniBarChart data={valoareData} valueKey="valoare_factura" color="var(--l2)" colorLight="rgba(124,58,237,0.2)" unit="RON" />
          </div>
        )}

        {apartamente.length > 0 && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700}}>Consum per proprietar - 12 luni</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>scroll →</div>
            </div>
            <ProprietarChart luni={istoricLuni} citiri={istoricCitiri} apartamente={apartamente} />
          </div>
        )}

      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,0.06)'}}>
        {[
          {icon:'📊',label:'Dashboard',href:'/dashboard'},
          {icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},
          {icon:'💳',label:'Plati',href:'/dashboard/plati'},
          {icon:'📈',label:'Grafice',href:'/dashboard/grafice'},
          {icon:'⚙️',label:'Setari',href:'/dashboard/setari'},
        ].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:item.href==='/dashboard'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
