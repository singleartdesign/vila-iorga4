'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']
const PROPRIETARI = ['Ariton Alex','Avadanei Viorica','Tanasescu Carmen','Vlad Stefan','Pavel Corina']

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [lunaActuala, setLunaActuala] = useState(null)
  const [citiri, setCitiri] = useState([])
  const [plati, setPlati] = useState([])
  const [calcule, setCalcule] = useState([])
  const [istoricLuni, setIstoricLuni] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: luni } = await supabase
      .from('luni_facturare')
      .select('*')
      .order('an', { ascending: false })
      .order('luna', { ascending: false })
      .limit(12)
    
    if (luni && luni.length > 0) {
      setLunaActuala(luni[0])
      setIstoricLuni([...luni].reverse())

      const { data: cit } = await supabase
        .from('citiri')
        .select('*, apartamente(numar, proprietar_nume)')
        .eq('luna_id', luni[0].id)

      const { data: calc } = await supabase
        .from('calcule_lunare')
        .select('*, apartamente(numar, proprietar_nume)')
        .eq('luna_id', luni[0].id)

      const { data: pl } = await supabase
        .from('plati')
        .select('*, apartamente(numar, proprietar_nume)')
        .eq('luna_id', luni[0].id)

      setCitiri(cit || [])
      setCalcule(calc || [])
      setPlati(pl || [])
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

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

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif'}}>
      
      {/* HEADER */}
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

      {/* TAB NAV */}
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
            fontSize:12,fontWeight:700,color:tab.href==='/dashboard'?'var(--t1)':'var(--text3)',
            borderBottom:tab.href==='/dashboard'?'2.5px solid var(--t1)':'2.5px solid transparent',
            textDecoration:'none',whiteSpace:'nowrap',fontFamily:'Nunito,sans-serif'
          }}>{tab.icon} {tab.label}</a>
        ))}
      </div>

      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12,maxWidth:900,margin:'0 auto'}}>

        {/* LUNA CURENTA */}
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

        {/* STAT PILLS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Colectat luna asta</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalColectat.toFixed(0)} <span style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>RON</span></div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Restante luna asta</div>
            <div style={{fontSize:22,fontWeight:800,color:nrRestante>0?'#f97316':'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalRestant.toFixed(0)} <span style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>RON</span></div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Pierdere apa</div>
            <div style={{fontSize:22,fontWeight:800,color:'#f97316',fontFamily:'Sora,sans-serif'}}>{pierdere.toFixed(2)} <span style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>mc</span></div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Citiri introduse</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--l2)',fontFamily:'Sora,sans-serif'}}>{citiri.length} <span style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>din 5</span></div>
          </div>
        </div>

        {/* SITUATIE PLATI */}
        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12,color:'var(--text)'}}>Situatie plati - {lunaNume}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {calcule.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'20px 0',fontSize:13}}>
                Nu exista calcule pentru luna aceasta. Introduceti citirile mai intai.
              </div>
            ) : calcule.sort((a,b) => a.apartamente.numar - b.apartamente.numar).map((calc, i) => {
              const plata = plati.find(p => p.apartament_id === calc.apartament_id)
              const platit = plata?.suma_platita || 0
              const rest = Math.max(0, calc.suma_calculata - platit)
              const status = rest === 0 ? 'platit' : platit > 0 ? 'partial' : 'neplatit'
              const culori = {platit:{bg:'var(--t7)',border:'var(--t2)',text:'var(--t1)',label:'Platit'},partial:{bg:'var(--l7)',border:'var(--l4)',text:'var(--l2)',label:'Partial'},neplatit:{bg:'#fff7ed',border:'#fed7aa',text:'#f97316',label:'Neplatit'}}
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

        {/* GRAFIC CONSUM 12 LUNI */}
        {istoricLuni.length > 0 && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:14,color:'var(--text)'}}>Consum facturat - ultimele {istoricLuni.length} luni (mc)</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:120,padding:'0 4px'}}>
              {istoricLuni.map((luna, i) => {
                const maxVal = Math.max(...istoricLuni.map(l => l.consum_facturat))
                const h = (luna.consum_facturat / maxVal) * 100
                const isLast = i === istoricLuni.length - 1
                return (
                  <div key={luna.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{fontSize:9,color:'var(--t1)',fontWeight:700,opacity:isLast?1:0}}>{luna.consum_facturat}</div>
                    <div style={{
                      width:'100%',borderRadius:'4px 4px 0 0',
                      background:isLast?'linear-gradient(180deg,var(--t2),var(--t1))':'linear-gradient(180deg,var(--l5),var(--l4))',
                      height:`${h}%`,minHeight:4,transition:'height 0.3s'
                    }}></div>
                    <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textAlign:'center'}}>{LUNI_NUME[luna.luna]}</div>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:16,marginTop:8,justifyContent:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)'}}>
                <div style={{width:12,height:12,borderRadius:3,background:'var(--t2)'}}></div>Luna curenta
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text3)'}}>
                <div style={{width:12,height:12,borderRadius:3,background:'var(--l4)'}}></div>Luni anterioare
              </div>
            </div>
          </div>
        )}

        {/* GRAFIC VALOARE FACTURI */}
        {istoricLuni.length > 0 && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:14,color:'var(--text)'}}>Valoare facturi - ultimele {istoricLuni.length} luni (RON)</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:100,padding:'0 4px'}}>
              {istoricLuni.map((luna, i) => {
                const maxVal = Math.max(...istoricLuni.map(l => l.valoare_factura))
                const h = (luna.valoare_factura / maxVal) * 100
                const isLast = i === istoricLuni.length - 1
                return (
                  <div key={luna.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{
                      width:'100%',borderRadius:'4px 4px 0 0',
                      background:isLast?'linear-gradient(180deg,var(--l3),var(--l2))':'linear-gradient(180deg,var(--t4),var(--t2))',
                      height:`${h}%`,minHeight:4
                    }}></div>
                    <div style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>{LUNI_NUME[luna.luna]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
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
