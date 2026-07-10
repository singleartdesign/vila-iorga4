'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']

export default function Plati() {
  const [profile, setProfile] = useState(null)
  const [lunaActuala, setLunaActuala] = useState(null)
  const [calcule, setCalcule] = useState([])
  const [plati, setPlati] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [suma, setSuma] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data: luni } = await supabase.from('luni_facturare').select('*').order('an',{ascending:false}).order('luna',{ascending:false}).limit(1)
    if (luni && luni.length > 0) {
      setLunaActuala(luni[0])
      const { data: calc } = await supabase.from('calcule_lunare').select('*, apartamente(numar,proprietar_nume)').eq('luna_id', luni[0].id)
      const { data: pl } = await supabase.from('plati').select('*, apartamente(numar,proprietar_nume)').eq('luna_id', luni[0].id)
      setCalcule(calc || [])
      setPlati(pl || [])
    }
    setLoading(false)
  }

  function getPlata(aptId) { return plati.find(p => p.apartament_id === aptId) }
  function canEdit() { return profile?.rol === 'administrator' || profile?.rol === 'manager' }

  function openModal(calc) {
    const plata = getPlata(calc.apartament_id)
    setSuma(plata?.suma_platita?.toString() || '')
    setModal(calc)
    setMsg('')
  }

  async function savePlata() {
    if (!modal || !lunaActuala) return
    const s = parseFloat(suma)
    if (isNaN(s) || s < 0) { setMsg('Introdu o suma valida!'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const plataExistenta = getPlata(modal.apartament_id)
    const rest = Math.max(0, modal.suma_calculata - s)
    const status = s <= 0 ? 'neplatit' : s >= modal.suma_calculata ? 'integral' : 'partial'
    let error
    if (plataExistenta) {
      const { error: e } = await supabase.from('plati').update({
        suma_platita: s, rest_de_plata: rest, status,
        data_plata: new Date().toISOString(), inregistrat_de: user.id, actualizat_la: new Date().toISOString()
      }).eq('id', plataExistenta.id)
      error = e
    } else {
      const { error: e } = await supabase.from('plati').insert({
        luna_id: lunaActuala.id, apartament_id: modal.apartament_id,
        suma_calculata: modal.suma_calculata, suma_platita: s,
        rest_de_plata: rest, status, data_plata: new Date().toISOString(), inregistrat_de: user.id
      })
      error = e
    }
    if (error) { setMsg('Eroare: ' + error.message) }
    else { setModal(null); setSuma(''); await loadData() }
    setSaving(false)
  }

  const lunaNume = lunaActuala ? `${LUNI_NUME[lunaActuala.luna]} ${lunaActuala.an}` : ''
  const totalCalc = calcule.reduce((s,c) => s+(c.suma_calculata||0), 0)
  const totalPlatit = plati.reduce((s,p) => s+(p.suma_platita||0), 0)
  const totalRest = Math.max(0, totalCalc - totalPlatit)
  const pretPerMc = lunaActuala?.pret_per_mc || 0

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40}}>💧</div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Plati si Solduri</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{lunaNume}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600}}>{profile?.nume}</div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Total</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Sora,sans-serif'}}>{totalCalc.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Colectat</div>
            <div style={{fontSize:18,fontWeight:800,color:'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalPlatit.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Restant</div>
            <div style={{fontSize:18,fontWeight:800,color:totalRest>0?'#f97316':'var(--t1)',fontFamily:'Sora,sans-serif'}}>{totalRest.toFixed(0)}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Plati {lunaNume}</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {calcule.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'20px 0',fontSize:13}}>Nu exista calcule. Introduceti citirile mai intai.</div>
            ) : calcule.sort((a,b) => a.apartamente.numar-b.apartamente.numar).map((calc,i) => {
              const plata = getPlata(calc.apartament_id)
              const platit = plata?.suma_platita || 0
              const rest = Math.max(0, calc.suma_calculata - platit)
              const status = rest === 0 ? 'platit' : platit > 0 ? 'partial' : 'neplatit'
              const pct = calc.suma_calculata > 0 ? Math.min(100,(platit/calc.suma_calculata)*100) : 0
              const cs = {
                platit:{text:'var(--t1)',border:'var(--t2)',bg:'var(--t6)',label:'Platit integral'},
                partial:{text:'var(--l2)',border:'var(--l4)',bg:'var(--l6)',label:'Platit partial'},
                neplatit:{text:'#f97316',border:'#fed7aa',bg:'#fff7ed',label:'Neplatit'}
              }[status]

              // Calcul detaliat consum vs pierdere
              const consumPropriu = calc.consum_individual || 0
              const pierdereRepartizata = calc.pierdere_repartizata || 0
              const sumaConsum = consumPropriu * pretPerMc
              const sumaPierdere = pierdereRepartizata * pretPerMc

              return (
                <div key={calc.id} style={{padding:'14px',background:'var(--bg)',borderRadius:'var(--r-sm)',borderLeft:`3px solid ${cs.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:CULORI[i%5],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12,flexShrink:0}}>
                      {calc.apartamente.proprietar_nume.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{calc.apartamente.proprietar_nume}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>Ap. {calc.apartamente.numar}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:16,fontWeight:800,color:cs.text,fontFamily:'Sora,sans-serif'}}>{calc.suma_calculata?.toFixed(2)} RON</div>
                      <div style={{fontSize:10,fontWeight:700,color:cs.text}}>{cs.label}</div>
                    </div>
                  </div>

                  {/* DETALIU SUMA */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
                    <div style={{padding:'8px',background:'#fff',borderRadius:8,textAlign:'center',border:'1px solid var(--border)'}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,marginBottom:2}}>Consum propriu</div>
                      <div style={{fontSize:11,fontWeight:800,color:'var(--t1)'}}>{consumPropriu.toFixed(2)} mc</div>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text2)'}}>{sumaConsum.toFixed(2)} RON</div>
                    </div>
                    <div style={{padding:'8px',background:'#fff7ed',borderRadius:8,textAlign:'center',border:'1px solid #fed7aa'}}>
                      <div style={{fontSize:9,color:'#b45309',fontWeight:600,marginBottom:2}}>Pierdere</div>
                      <div style={{fontSize:11,fontWeight:800,color:'#f97316'}}>{pierdereRepartizata.toFixed(2)} mc</div>
                      <div style={{fontSize:10,fontWeight:700,color:'#f97316'}}>{sumaPierdere.toFixed(2)} RON</div>
                    </div>
                    <div style={{padding:'8px',background:cs.bg,borderRadius:8,textAlign:'center',border:`1px solid ${cs.border}`}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,marginBottom:2}}>Total</div>
                      <div style={{fontSize:11,fontWeight:800,color:cs.text}}>{calc.mc_de_plata?.toFixed(2)} mc</div>
                      <div style={{fontSize:10,fontWeight:700,color:cs.text}}>{calc.suma_calculata?.toFixed(2)} RON</div>
                    </div>
                  </div>

                  {/* PROGRESS */}
                  <div style={{height:6,background:'rgba(148,163,184,0.2)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,var(--t3),var(--t1))`,width:`${pct}%`,transition:'width 0.5s'}}></div>
                  </div>

                  {rest > 0 && <div style={{fontSize:11,color:'#f97316',fontWeight:600,marginBottom:8}}>Rest de plata: {rest.toFixed(2)} RON</div>}

                  {canEdit() && (
                    <button onClick={() => openModal(calc)} style={{
                      width:'100%',padding:'9px',
                      background:status==='platit'?'var(--surface2)':'linear-gradient(135deg,var(--l3),var(--t2))',
                      border:'none',borderRadius:8,
                      color:status==='platit'?'var(--text2)':'#fff',
                      fontSize:12,fontWeight:700,cursor:'pointer'
                    }}>
                      {status==='platit'?'✏️ Modifica plata':'💳 Inregistreaza plata'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:17,fontWeight:700,marginBottom:4}}>Inregistreaza plata</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>{modal.apartamente.proprietar_nume} · Ap. {modal.apartamente.numar}</div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
              <div style={{padding:'10px',background:'var(--t7)',borderRadius:10,textAlign:'center',border:'1px solid var(--t5)'}}>
                <div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>Consum</div>
                <div style={{fontSize:12,fontWeight:800,color:'var(--t1)'}}>{((modal.consum_individual||0)*pretPerMc).toFixed(2)}</div>
                <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
              </div>
              <div style={{padding:'10px',background:'#fff7ed',borderRadius:10,textAlign:'center',border:'1px solid #fed7aa'}}>
                <div style={{fontSize:9,color:'#b45309',marginBottom:2}}>Pierdere</div>
                <div style={{fontSize:12,fontWeight:800,color:'#f97316'}}>{((modal.pierdere_repartizata||0)*pretPerMc).toFixed(2)}</div>
                <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
              </div>
              <div style={{padding:'10px',background:'var(--l7)',borderRadius:10,textAlign:'center',border:'1px solid var(--l5)'}}>
                <div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>Total</div>
                <div style={{fontSize:12,fontWeight:800,color:'var(--l2)'}}>{modal.suma_calculata?.toFixed(2)}</div>
                <div style={{fontSize:9,color:'var(--text3)'}}>RON</div>
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Suma platita (RON)</label>
              <input type="number" step="0.01" value={suma} onChange={e => setSuma(e.target.value)}
                style={{width:'100%',padding:'13px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:18,fontFamily:'Nunito,sans-serif',outline:'none',fontWeight:700}}
                placeholder="0.00"
              />
            </div>
            <button onClick={() => setSuma(modal.suma_calculata?.toFixed(2))} style={{
              width:'100%',padding:'9px',background:'var(--t6)',border:'1.5px solid var(--t4)',
              borderRadius:8,fontSize:12,fontWeight:700,color:'var(--t1)',cursor:'pointer',marginBottom:12
            }}>
              Plateste integral: {modal.suma_calculata?.toFixed(2)} RON
            </button>

            {msg && <div style={{padding:'10px',background:'#fee2e2',borderRadius:10,color:'#b91c1c',fontSize:13,marginBottom:12}}>{msg}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button onClick={() => setModal(null)} style={{padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>Anuleaza</button>
              <button onClick={savePlata} disabled={saving} style={{padding:13,background:'linear-gradient(135deg,var(--l3),var(--t2))',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving?'Se salveaza...':'✅ Confirma plata'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:item.href==='/dashboard/plati'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
