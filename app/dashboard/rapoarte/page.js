'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']

export default function Rapoarte() {
  const [profile, setProfile] = useState(null)
  const [luni, setLuni] = useState([])
  const [lunaSelectata, setLunaSelectata] = useState(null)
  const [situatie, setSituatie] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data: l } = await supabase.from('luni_facturare').select('*').order('an', { ascending: false }).order('luna', { ascending: false }).limit(24)
    setLuni(l || [])
    if (l && l.length > 0) {
      setLunaSelectata(l[0])
      await loadSituatie(l[0].id)
    }
    setLoading(false)
  }

  async function loadSituatie(lunaId) {
    const { data: calc } = await supabase.from('calcule_lunare').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', lunaId)
    const { data: pl } = await supabase.from('plati').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', lunaId)
    const { data: cit } = await supabase.from('citiri').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', lunaId)

    const combined = (calc || []).map(c => {
      const plata = (pl || []).find(p => p.apartament_id === c.apartament_id)
      const citire = (cit || []).find(ci => ci.apartament_id === c.apartament_id)
      return {
        ...c,
        suma_platita: plata?.suma_platita || 0,
        status: plata?.status || 'neplatit',
        index_vechi: citire?.index_vechi,
        index_nou: citire?.index_nou,
      }
    }).sort((a,b) => a.apartamente.numar - b.apartamente.numar)
    setSituatie(combined)
  }

  async function selectLuna(luna) {
    setLunaSelectata(luna)
    await loadSituatie(luna.id)
  }

  const totalCalc = situatie.reduce((s,c) => s + (c.suma_calculata || 0), 0)
  const totalPlatit = situatie.reduce((s,c) => s + (c.suma_platita || 0), 0)
  const totalRest = Math.max(0, totalCalc - totalPlatit)
  const lunaNume = lunaSelectata ? `${LUNI_NUME[lunaSelectata.luna]} ${lunaSelectata.an}` : ''

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40}}>📋</div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Rapoarte</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{lunaNume}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600}}>{profile?.nume}</div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        {/* SELECTIE LUNA */}
        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>Selecteaza luna</div>
          <div style={{display:'flex',overflowX:'auto',gap:8,paddingBottom:4}}>
            {luni.map(luna => (
              <button key={luna.id} onClick={() => selectLuna(luna)} style={{
                padding:'7px 14px',borderRadius:20,border:'none',cursor:'pointer',whiteSpace:'nowrap',
                background: lunaSelectata?.id === luna.id ? 'linear-gradient(135deg,var(--l3),var(--t2))' : 'var(--bg)',
                color: lunaSelectata?.id === luna.id ? '#fff' : 'var(--text3)',
                fontSize:12,fontWeight:700,flexShrink:0
              }}>
                {LUNI_NUME[luna.luna]} {luna.an}
              </button>
            ))}
          </div>
        </div>

        {/* SUMAR LUNA */}
        {lunaSelectata && (
          <div style={{background:'linear-gradient(135deg,var(--t7),var(--l7))',borderRadius:'var(--r)',padding:'14px 16px',border:'1.5px solid var(--t5)'}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:10}}>Raport {lunaNume}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{padding:'10px',background:'#fff',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>Consum facturat</div>
                <div style={{fontSize:17,fontWeight:800,color:'var(--t1)'}}>{lunaSelectata.consum_facturat} mc</div>
              </div>
              <div style={{padding:'10px',background:'#fff',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>Valoare factura</div>
                <div style={{fontSize:17,fontWeight:800,color:'var(--l2)'}}>{lunaSelectata.valoare_factura?.toFixed(2)} RON</div>
              </div>
              <div style={{padding:'10px',background:'#fff',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>Pret per mc</div>
                <div style={{fontSize:17,fontWeight:800,color:'var(--t1)'}}>{lunaSelectata.pret_per_mc?.toFixed(2)} RON</div>
              </div>
              <div style={{padding:'10px',background:'#fff',borderRadius:10,textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>Repartizare</div>
                <div style={{fontSize:14,fontWeight:800,color:'var(--text)',textTransform:'capitalize'}}>{lunaSelectata.mod_repartizare}</div>
              </div>
            </div>
          </div>
        )}

        {/* SUMAR PLATI */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Total</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Sora,sans-serif'}}>{totalCalc.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Colectat</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalPlatit.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Restant</div>
            <div style={{fontSize:18,fontWeight:800,color:totalRest>0?'#f97316':'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalRest.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
        </div>

        {/* TABEL DETALIAT */}
        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Detaliu per proprietar</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {situatie.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'20px 0',fontSize:13}}>Nu exista date pentru luna selectata.</div>
            ) : situatie.map((item, i) => {
              const rest = Math.max(0, item.suma_calculata - item.suma_platita)
              const status = rest === 0 ? 'platit' : item.suma_platita > 0 ? 'partial' : 'neplatit'
              const statusColor = {platit:'var(--t1)', partial:'var(--l2)', neplatit:'#f97316'}
              const statusLabel = {platit:'Platit', partial:'Partial', neplatit:'Neplatit'}
              return (
                <div key={item.id} style={{padding:'12px',background:'var(--bg)',borderRadius:'var(--r-sm)',borderLeft:`3px solid ${statusColor[status]}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:CULORI[i%5],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>
                      {item.apartamente.proprietar_nume.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{item.apartamente.proprietar_nume}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>Ap. {item.apartamente.numar}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,fontWeight:800,color:statusColor[status]}}>{statusLabel[status]}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6}}>
                    <div style={{textAlign:'center',padding:'6px',background:'#fff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'var(--text3)'}}>Consum</div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--t1)'}}>{item.consum_individual?.toFixed(2)}</div>
                      <div style={{fontSize:9,color:'var(--text3)'}}>mc</div>
                    </div>
                    <div style={{textAlign:'center',padding:'6px',background:'#fff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'var(--text3)'}}>De platit</div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{item.suma_calculata?.toFixed(0)}</div>
                      <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
                    </div>
                    <div style={{textAlign:'center',padding:'6px',background:'#fff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'var(--text3)'}}>Platit</div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--t1)'}}>{item.suma_platita?.toFixed(0)}</div>
                      <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
                    </div>
                    <div style={{textAlign:'center',padding:'6px',background:'#fff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'var(--text3)'}}>Rest</div>
                      <div style={{fontSize:12,fontWeight:700,color:rest>0?'#f97316':'var(--t1)'}}>{rest.toFixed(0)}</div>
                      <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
