'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Icon from '@/lib/Icon'
import Avatar from '@/lib/Avatar'
import { useRouter } from 'next/navigation'
import { sumaApometreCorectata } from '@/lib/verificari'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const CULORI = ['#0f8b8d','#7a5cc4','#e08a3c','#9aa5ad','#3d7fd1']
const CULORI_LIGHT = ['rgba(224,123,57,0.2)','rgba(37,99,168,0.2)','rgba(5,150,105,0.2)','rgba(124,58,237,0.2)','rgba(185,28,28,0.2)']

function BarChart({ data, valueKey, color, colorLight, unit, height=140 }) {
  const scrollRef = useRef(null)
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [data])

  const vals = data.map(d => d[valueKey] || 0).filter(v => v > 0)
  if (!vals.length) return <div style={{textAlign:'center',color:'var(--text3)',padding:20,fontSize:12}}>Nu sunt date</div>
  const maxVal = Math.max(...vals)
  const minVal = Math.min(...vals) * 0.7
  const range = maxVal - minVal || 1
  
  return (
    <div ref={scrollRef} style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:5,height,minWidth:data.length*38,paddingTop:4}}>
        {data.map((item,i) => {
          const val = item[valueKey] || 0
          const h = val > 0 ? Math.max(((val-minVal)/range)*(height-36),6) : 0
          const isLast = i === data.length-1
          const displayVal = unit==='RON' ? Math.round(val) : val
          return (
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:32,flex:1}}>
              <div style={{fontSize:8,fontWeight:500,height:12,color:color,textAlign:'center',lineHeight:'12px'}}>
                {val > 0 ? displayVal : ''}
              </div>
              <div style={{width:24,borderRadius:'4px 4px 0 0',background:isLast?color:colorLight,height:h,minHeight:val>0?3:0}}></div>
              <div style={{fontSize:8,color:isLast?color:'var(--text3)',fontWeight:isLast?700:600}}>{LUNI_NUME[item.luna]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProprietarChart({ luni, citiriIst, apartamente, height=160 }) {
  const scrollRef = useRef(null)
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [luni])

  if (!luni.length || !apartamente.length || !citiriIst.length) return (
    <div style={{textAlign:'center',color:'var(--text3)',padding:20,fontSize:12}}>Nu sunt date</div>
  )
  const allConsumuri = citiriIst.map(c => c.consum||0).filter(v=>v>0)
  const maxVal = Math.max(...allConsumuri, 1)

  const statPerApt = {}
  apartamente.forEach(apt => {
    const consumuriApt = citiriIst.filter(c => c.apartament_id === apt.id && (c.consum||0) > 0).map(c => c.consum||0)
    if (consumuriApt.length > 0) {
      statPerApt[apt.id] = { max: Math.max(...consumuriApt), min: Math.min(...consumuriApt) }
    }
  })

  return (
    <div>
      <div ref={scrollRef} style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:4,height,minWidth:luni.length*52,paddingTop:20}}>
          {luni.map((luna,li) => {
            const citiriLuna = citiriIst.filter(c => c.luna_id === luna.id)
            const isLast = li === luni.length-1
            return (
              <div key={luna.id} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,minWidth:46,height:'100%'}}>
                <div style={{display:'flex',alignItems:'flex-end',gap:2,flex:1,width:'100%',position:'relative'}}>
                  {apartamente.map((apt,ai) => {
                    const cit = citiriLuna.find(c => c.apartament_id === apt.id)
                    const consum = cit?.consum || 0
                    const h = Math.max((consum/maxVal)*120, consum>0?4:0)
                    const stat = statPerApt[apt.id]
                    const isMax = stat && consum === stat.max
                    const isMin = stat && consum === stat.min && consum > 0
                    return (
                      <div key={apt.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}}>
                        {(isMax || isMin) && consum > 0 && (
                          <div style={{fontSize:7,fontWeight:500,color:CULORI[ai%5],marginBottom:1,lineHeight:1}}>
                            {consum.toFixed(1)}
                          </div>
                        )}
                        <div style={{
                          width:'100%',borderRadius:'3px 3px 0 0',
                          background: isLast ? CULORI[ai%5] : CULORI_LIGHT[ai%5],
                          height: h
                        }}/>
                      </div>
                    )
                  })}
                </div>
                <div style={{fontSize:8,color:isLast?'var(--t1)':'var(--text3)',fontWeight:isLast?700:600,marginTop:3,textAlign:'center'}}>
                  {LUNI_NUME[luna.luna]}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
        {apartamente.map((apt,i) => (
          <div key={apt.id} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--text2)',fontWeight:600}}>
            <div style={{width:10,height:10,borderRadius:2,background:CULORI[i%5]}}></div>
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
  const [citiriIst, setCitiriIst] = useState([])
  const [apartamente, setApartamente] = useState([])
  const [loading, setLoading] = useState(true)
  const [avatare, setAvatare] = useState({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    supabase.rpc('avatare').then(({ data }) => {
      const m = {}; (data || []).forEach(a => { if (a.apartament_id && !m[a.apartament_id]) m[a.apartament_id] = a.avatar_url }); setAvatare(m)
    })
    const { data: luni } = await supabase.from('luni_facturare').select('*').order('an',{ascending:false}).order('luna',{ascending:false}).limit(12)
    if (luni && luni.length > 0) {
      const luniRev = [...luni].reverse()
      setLunaActuala(luni[0])
      setIstoricLuni(luniRev)
      const { data: cit } = await supabase.from('citiri').select('*, apartamente(numar,proprietar_nume)').eq('luna_id', luni[0].id)
      const { data: calc } = await supabase.from('calcule_lunare').select('*, apartamente(numar,proprietar_nume)').eq('luna_id', luni[0].id)
      const { data: pl } = await supabase.from('plati').select('*, apartamente(numar,proprietar_nume)').eq('luna_id', luni[0].id)
      setCitiri(cit || [])
      setCalcule(calc || [])
      setPlati(pl || [])
      const lunaIds = luniRev.map(l => l.id)
      const { data: citIst } = await supabase.from('citiri').select('luna_id,apartament_id,consum').in('luna_id', lunaIds)
      setCitiriIst(citIst || [])
      const { data: apt } = await supabase.from('apartamente').select('*').eq('activ',true).order('numar')
      setApartamente(apt || [])
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center'}}><div style={{display:'flex',justifyContent:'center',color:'var(--t2)'}}><Icon name="picatura" size={44} stroke={1.3} /></div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  const totalFactura = lunaActuala?.valoare_factura || 0
  const totalColectat = plati.reduce((s,p) => s+(p.suma_platita||0), 0)
  const totalRestant = plati.reduce((s,p) => s+Math.max(0,(Number(p.suma_calculata)||0)+(Number(p.sold_anterior)||0)-(Number(p.suma_platita)||0)), 0)
  const pierdere = lunaActuala ? lunaActuala.consum_facturat - sumaApometreCorectata(citiri) : 0
  const nrRestante = plati.filter(p => (Number(p.suma_calculata)||0)+(Number(p.sold_anterior)||0)>(Number(p.suma_platita)||0)+0.005).length
  const lunaNume = lunaActuala ? `${LUNI_NUME[lunaActuala.luna]} ${lunaActuala.an}` : ''
  const consumData = istoricLuni.map(l => ({luna:l.luna, an:l.an, consum_facturat:l.consum_facturat}))
  const valoareData = istoricLuni.map(l => ({luna:l.luna, an:l.an, valoare_factura:l.valoare_factura}))

  return (
    <div style={{minHeight:'100vh',background:'transparent',fontFamily:'var(--font)',paddingBottom:90}}>

      <div style={{background:'var(--hdr)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Icon name="picatura" size={26} stroke={1.5} style={{color:'#8fdde0'}} />
          <div>
            <div style={{color:'#fff',fontWeight:600,fontSize:16,fontFamily:'var(--font-display)'}}>Vila Iorga 4</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>Administrare apa</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard/setari" title="Contul meu" style={{textDecoration:'none'}}><Avatar url={profile?.avatar_url} nume={profile?.nume} size={34} color={CULORI[((profile?.apartament_id||4)-1)%5]} style={{boxShadow:'0 0 0 2px rgba(255,255,255,0.5)'}} /></a>
          <div style={{textAlign:'right'}}>
            <div style={{color:'#fff',fontSize:13,fontWeight:500}}>{profile?.nume}</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:10,textTransform:'capitalize'}}>{profile?.rol}</div>
          </div>
          <button onClick={handleLogout} style={{padding:'6px 12px',background:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:500}}>Iesi</button>
        </div>
      </div>

      <div style={{background:'rgba(250,246,242,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.7)',display:'flex',overflowX:'auto',padding:'0 10px'}}>
        {[
          {label:'Dashboard',icon:'dashboard',href:'/dashboard'},
          {label:'Citiri',icon:'citiri',href:'/dashboard/citiri'},
          {label:'Facturi',icon:'facturi',href:'/dashboard/facturi'},
          {label:'Plati',icon:'plati',href:'/dashboard/plati'},
          {label:'Rapoarte',icon:'rapoarte',href:'/dashboard/rapoarte'},
          {label:'Setari',icon:'setari',href:'/dashboard/setari'},
        ].map(tab => (
          <a key={tab.href} href={tab.href} style={{
            display:'flex',alignItems:'center',gap:5,padding:'11px 14px',fontSize:12,fontWeight:500,
            color:tab.href==='/dashboard'?'var(--t1)':'var(--text3)',
            borderBottom:tab.href==='/dashboard'?'2.5px solid var(--t1)':'2.5px solid transparent',
            textDecoration:'none',whiteSpace:'nowrap'
          }}><Icon name={tab.icon} size={16} /> {tab.label}</a>
        ))}
      </div>

      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12,maxWidth:900,margin:'0 auto'}}>

        {lunaActuala && (
          <div style={{background:'linear-gradient(135deg,var(--t7),var(--l7))',border:'1.5px solid var(--t5)',borderRadius:'var(--r)',padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,marginBottom:3}}>LUNA CURENTA</div>
              <div style={{fontSize:18,fontWeight:600,color:'var(--text)',fontFamily:'var(--font-display)'}}>{lunaNume}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{lunaActuala.consum_facturat} mc · {lunaActuala.pret_per_mc?.toFixed(2)} RON/mc</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:600,color:'var(--l2)',fontFamily:'var(--font-display)'}}>{totalFactura.toFixed(2)}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>RON total factura</div>
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {[
            {label:'Colectat',val:totalColectat.toFixed(0),unit:'RON',color:'var(--t1)'},
            {label:'Restante',val:totalRestant.toFixed(0),unit:'RON',color:nrRestante>0?'#f97316':'var(--t1)'},
            !(Number(lunaActuala?.consum_facturat) > 0) ? {label:'Factura', val:'in asteptare', unit:'', color:'var(--text3)'} : {label: pierdere > 0.005 ? 'Contor general peste apometre' : pierdere < -0.005 ? 'Apometre peste contor general' : 'Contor general = apometre', val:(pierdere > 0.005 ? '+' : pierdere < -0.005 ? '−' : '')+Math.abs(pierdere).toFixed(2),unit:'mc',color:Math.abs(pierdere) > 0.005 ? '#f97316' : 'var(--t1)'},
            {label:'Citiri',val:`${citiri.length}/5`,unit:'introduse',color:'var(--l2)'},
          ].map(s => (
            <div key={s.label} style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,color:'var(--text3)',fontWeight:500,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:600,color:s.color,fontFamily:'var(--font-display)'}}>{s.val} <span style={{fontSize:12,color:'var(--text3)',fontWeight:500}}>{s.unit}</span></div>
            </div>
          ))}
        </div>

        <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:500,marginBottom:12}}>Situatie plati - {lunaNume}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {calcule.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'20px 0',fontSize:13}}>Nu exista calcule pentru luna aceasta.</div>
            ) : calcule.sort((a,b) => a.apartamente.numar-b.apartamente.numar).map((calc,i) => {
              const plata = plati.find(p => p.apartament_id===calc.apartament_id)
              const platit = plata?.suma_platita||0
              const rest = Math.max(0, Math.round(((Number(calc.suma_calculata)||0)+(Number(plata?.sold_anterior)||0)-platit)*100)/100)
              const status = !(Number(lunaActuala?.consum_facturat) > 0) ? 'asteapta' : rest===0?'platit':platit>0?'partial':'neplatit'
              const c = {platit:{border:'var(--t2)',text:'var(--t1)',label:'Platit'},partial:{border:'var(--l4)',text:'var(--l2)',label:'Partial'},neplatit:{border:'#fed7aa',text:'#f97316',label:'Neplatit'},asteapta:{border:'var(--border)',text:'var(--text3)',label:'Asteapta factura'}}[status]
              return (
                <div key={calc.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--bg)',borderRadius:'var(--r-sm)',borderLeft:`3px solid ${c.border}`}}>
                  <Avatar url={avatare[calc.apartament_id]} nume={calc.apartamente.proprietar_nume} size={38} color={CULORI[i%5]} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{calc.apartamente.proprietar_nume}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>Ap. {calc.apartamente.numar} · {Number(calc.consum_individual).toFixed(2)} mc{Number(lunaActuala?.consum_facturat) > 0 && Math.abs(Number(calc.pierdere_repartizata)) > 0.005 && <> · ajustare <span style={{color:'#f97316'}}>{Number(calc.pierdere_repartizata) > 0 ? '+' : '−'}{Math.abs(Number(calc.pierdere_repartizata)).toFixed(2)} mc</span></>}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {Math.abs(Number(plata?.sold_anterior) || 0) > 0.005 && (
                      <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>
                        luna {Number(calc.suma_calculata).toFixed(2)} {Number(plata.sold_anterior) < 0 ? `− avans ${(-Number(plata.sold_anterior)).toFixed(2)}` : `+ restanta ${Number(plata.sold_anterior).toFixed(2)}`}
                      </div>
                    )}
                    <div style={{fontSize:14,fontWeight:600,color:c.text,fontFamily:'var(--font-display)'}}>{((Number(calc.suma_calculata)||0)+(Number(plata?.sold_anterior)||0)).toFixed(2)} RON</div>
                    <div style={{fontSize:10,fontWeight:500,color:c.text}}>{c.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {istoricLuni.length > 0 && (
          <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:500}}>Consum facturat - 12 luni (mc)</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>← scroll</div>
            </div>
            <BarChart data={consumData} valueKey="consum_facturat" color="var(--t1)" colorLight="rgba(20,184,166,0.25)" unit="mc" />
          </div>
        )}

        {istoricLuni.length > 0 && (
          <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:500}}>Valoare facturi - 12 luni (RON)</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>← scroll</div>
            </div>
            <BarChart data={valoareData} valueKey="valoare_factura" color="var(--l2)" colorLight="rgba(124,58,237,0.2)" unit="RON" />
          </div>
        )}

        {apartamente.length > 0 && citiriIst.length > 0 && (
          <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:500}}>Consum per proprietar - 12 luni</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>← scroll</div>
            </div>
            <ProprietarChart luni={istoricLuni} citiriIst={citiriIst} apartamente={apartamente} />
          </div>
        )}

      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--glass)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.8)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,0.06)'}}>
        {[
          {icon:'dashboard',label:'Dashboard',href:'/dashboard'},
          {icon:'citiri',label:'Citiri',href:'/dashboard/citiri'},
          {icon:'plati',label:'Plati',href:'/dashboard/plati'},
          {icon:'grafice',label:'Grafice',href:'/dashboard/grafice'},
          {icon:'setari',label:'Setari',href:'/dashboard/setari'},
        ].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:item.href==='/dashboard'?'var(--btn)':'rgba(255,255,255,0.65)',color:item.href==='/dashboard'?'#fff':'var(--text2)',border:'1px solid rgba(255,255,255,0.8)'}}><Icon name={item.icon} size={19} /></span>
            <span style={{fontSize:10,fontWeight:500,color:item.href==='/dashboard'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
