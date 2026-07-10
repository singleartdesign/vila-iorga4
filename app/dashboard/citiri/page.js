'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']
const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']

export default function Citiri() {
  const [profile, setProfile] = useState(null)
  const [lunaActuala, setLunaActuala] = useState(null)
  const [lunaPrecedenta, setLunaPrecedenta] = useState(null)
  const [apartamente, setApartamente] = useState([])
  const [citiri, setCitiri] = useState([])
  const [citiriPrecedente, setCitiriPrecedente] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({ index_vechi: '', index_nou: '', contor_nou: false, index_final_vechi: '', index_start_nou: '' })
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

    const { data: apt } = await supabase.from('apartamente').select('*').eq('activ', true).order('numar')
    setApartamente(apt || [])

    const { data: luni } = await supabase.from('luni_facturare').select('*').order('an', { ascending: false }).order('luna', { ascending: false }).limit(2)
    if (luni && luni.length > 0) {
      setLunaActuala(luni[0])
      if (luni.length > 1) setLunaPrecedenta(luni[1])

      const { data: cit } = await supabase.from('citiri').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', luni[0].id)
      setCitiri(cit || [])

      if (luni.length > 1) {
        const { data: citPrec } = await supabase.from('citiri').select('*').eq('luna_id', luni[1].id)
        setCitiriPrecedente(citPrec || [])
      }
    }
    setLoading(false)
  }

  function getCitire(aptId) {
    return citiri.find(c => c.apartament_id === aptId)
  }

  function getCitirePrecedenta(aptId) {
    return citiriPrecedente.find(c => c.apartament_id === aptId)
  }

  function canEdit(apt) {
    if (!profile) return false
    if (profile.rol === 'administrator' || profile.rol === 'manager') return true
    if (profile.rol === 'proprietar' && profile.apartament_id === apt.id) return true
    return false
  }

  function openModal(apt) {
    const citire = getCitire(apt.id)
    const citirePrec = getCitirePrecedenta(apt.id)
    const indexVechiAuto = citire?.index_vechi?.toString() || citirePrec?.index_nou?.toString() || ''
    setFormData({
      index_vechi: indexVechiAuto,
      index_nou: citire?.index_nou?.toString() || '',
      contor_nou: false,
      index_final_vechi: '',
      index_start_nou: '0'
    })
    setModal(apt)
    setMsg('')
  }

  async function saveCitire() {
    if (!modal || !lunaActuala) return
    const { data: { user } } = await supabase.auth.getUser()
    const citireExistenta = getCitire(modal.id)

    let index_vechi, index_nou

    if (formData.contor_nou) {
      // Contor schimbat: consumul = (index_final_vechi - index_vechi_precedent) + index_start_nou_la_citire
      const finalVechi = parseFloat(formData.index_final_vechi)
      const startNou = parseFloat(formData.index_start_nou) || 0
      const nouActual = parseFloat(formData.index_nou)
      if (isNaN(finalVechi) || isNaN(nouActual)) { setMsg('Completeaza toate campurile!'); return }
      // Salvam ca index_vechi = 0 (contor nou) si index_nou = consum total calculat + 0
      // De fapt salvam indexul real al contorului nou
      index_vechi = startNou
      index_nou = nouActual
    } else {
      index_vechi = parseFloat(formData.index_vechi)
      index_nou = parseFloat(formData.index_nou)
      if (isNaN(index_vechi) || isNaN(index_nou)) { setMsg('Introdu ambele indexuri!'); return }
      if (index_nou < index_vechi) { setMsg('Indexul nou trebuie sa fie mai mare sau egal cu cel vechi!'); return }
    }

    setSaving(true)
    let error
    if (citireExistenta) {
      const { error: e } = await supabase.from('citiri').update({
        index_vechi, index_nou, introdus_de: user.id, introdus_la: new Date().toISOString()
      }).eq('id', citireExistenta.id)
      error = e
    } else {
      const { error: e } = await supabase.from('citiri').insert({
        luna_id: lunaActuala.id, apartament_id: modal.id,
        index_vechi, index_nou, introdus_de: user.id
      })
      error = e
    }

    if (error) { setMsg('Eroare: ' + error.message) }
    else { setMsg(''); setModal(null); await loadData() }
    setSaving(false)
  }

  const lunaNume = lunaActuala ? `${LUNI_NUME[lunaActuala.luna]} ${lunaActuala.an}` : ''
  const totalConsum = citiri.reduce((s, c) => s + (c.consum || 0), 0)
  const pierdere = lunaActuala ? lunaActuala.consum_facturat - totalConsum : 0

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
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Citiri contoare</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{lunaNume}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600}}>{profile?.nume}</div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        {lunaActuala && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px 16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Facturat</div>
                <div style={{fontSize:18,fontWeight:800,color:'var(--t1)',fontFamily:'Sora,sans-serif'}}>{lunaActuala.consum_facturat}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>mc</div>
              </div>
              <div style={{textAlign:'center',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)'}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Citit ap.</div>
                <div style={{fontSize:18,fontWeight:800,color:'var(--l2)',fontFamily:'Sora,sans-serif'}}>{totalConsum.toFixed(2)}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>mc</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Pierdere</div>
                <div style={{fontSize:18,fontWeight:800,color:pierdere > 0 ? '#f97316' : 'var(--t1)',fontFamily:'Sora,sans-serif'}}>{pierdere.toFixed(2)}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>mc</div>
              </div>
            </div>
          </div>
        )}

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Citiri {lunaNume}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {apartamente.map((apt, i) => {
              const citire = getCitire(apt.id)
              const citirePrec = getCitirePrecedenta(apt.id)
              const editable = canEdit(apt)
              const hasData = citire && citire.index_nou !== undefined && citire.index_vechi !== undefined
              const consum = citire?.consum || 0
              return (
                <div key={apt.id} style={{
                  display:'flex',alignItems:'center',gap:10,padding:'12px',
                  background:'var(--bg)',borderRadius:'var(--r-sm)',
                  borderLeft:`3px solid ${hasData ? 'var(--t2)' : 'var(--border)'}`
                }}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:CULORI[i%5],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12,flexShrink:0}}>
                    {apt.proprietar_nume.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700}}>{apt.proprietar_nume}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>Ap. {apt.numar}</div>
                    {hasData && (
                      <div style={{fontSize:11,color:'var(--t1)',fontWeight:600,marginTop:2}}>
                        {citire.index_vechi} → {citire.index_nou} = <strong>{consum.toFixed(3)} mc</strong>
                      </div>
                    )}
                    {!hasData && citirePrec && (
                      <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>
                        Precedent: {citirePrec.index_nou}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                    {hasData ? (
                      <span style={{fontSize:10,fontWeight:700,color:'var(--t1)',background:'var(--t6)',padding:'2px 8px',borderRadius:12}}>✓ OK</span>
                    ) : (
                      <span style={{fontSize:10,fontWeight:700,color:'#f97316',background:'#fff7ed',padding:'2px 8px',borderRadius:12}}>Lipsa</span>
                    )}
                    {editable && (
                      <button onClick={() => openModal(apt)} style={{
                        padding:'6px 12px',
                        background:hasData?'var(--surface2)':'linear-gradient(135deg,var(--l3),var(--t2))',
                        border:'none',borderRadius:8,
                        color:hasData?'var(--text2)':'#fff',
                        fontSize:11,fontWeight:700,cursor:'pointer'
                      }}>
                        {hasData ? '✏️ Edit' : '+ Adauga'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500,boxShadow:'0 -8px 32px rgba(0,0,0,0.12)'}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:17,fontWeight:700,marginBottom:4}}>Citire contor</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:16}}>{modal.proprietar_nume} · Ap. {modal.numar}</div>

            {/* CHECKBOX CONTOR NOU */}
            <div onClick={() => setFormData({...formData, contor_nou: !formData.contor_nou})}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:formData.contor_nou?'#fff7ed':'var(--bg)',borderRadius:10,border:`1.5px solid ${formData.contor_nou?'#f97316':'var(--border)'}`,marginBottom:14,cursor:'pointer'}}>
              <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${formData.contor_nou?'#f97316':'var(--border)'}`,background:formData.contor_nou?'#f97316':'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {formData.contor_nou && <span style={{color:'#fff',fontSize:13,fontWeight:800}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:formData.contor_nou?'#f97316':'var(--text2)'}}>Contor schimbat luna aceasta</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>Bifeaza daca s-a inlocuit contorul</div>
              </div>
            </div>

            {formData.contor_nou ? (
              /* MOD CONTOR NOU */
              <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:12}}>
                <div style={{padding:'10px 14px',background:'#fff7ed',borderRadius:10,border:'1px solid #fed7aa',fontSize:12,color:'#b45309'}}>
                  Contorul vechi s-a oprit. Introdu indexul final al celui vechi si indexul initial si cel curent al celui nou.
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Index final contor VECHI (unde s-a oprit)</label>
                  <input type="number" step="0.001" value={formData.index_final_vechi}
                    onChange={e => setFormData({...formData, index_final_vechi: e.target.value})}
                    style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none'}}
                    placeholder="ex: 162.300"
                  />
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Index start contor NOU (de obicei 0)</label>
                  <input type="number" step="0.001" value={formData.index_start_nou}
                    onChange={e => setFormData({...formData, index_start_nou: e.target.value})}
                    style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none'}}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Index curent contor NOU (citirea de azi)</label>
                  <input type="number" step="0.001" value={formData.index_nou}
                    onChange={e => setFormData({...formData, index_nou: e.target.value})}
                    style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none'}}
                    placeholder="0.330"
                  />
                </div>
                {formData.index_final_vechi && formData.index_vechi && formData.index_nou && (
                  <div style={{padding:'10px',background:'var(--t7)',borderRadius:10,border:'1.5px solid var(--t5)',textAlign:'center'}}>
                    <span style={{fontSize:13,color:'var(--text2)'}}>Consum total: </span>
                    <strong style={{color:'var(--t1)',fontSize:15}}>
                      {(Math.max(0, parseFloat(formData.index_final_vechi) - parseFloat(formData.index_vechi)) + Math.max(0, parseFloat(formData.index_nou) - parseFloat(formData.index_start_nou||0))).toFixed(3)} mc
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              /* MOD NORMAL */
              <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>
                      Index vechi (mc)
                      {getCitirePrecedenta(modal.id) && <span style={{color:'var(--t1)',fontSize:10,marginLeft:4}}>· auto</span>}
                    </label>
                    <input type="number" step="0.001" value={formData.index_vechi}
                      onChange={e => setFormData({...formData, index_vechi: e.target.value})}
                      style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none',background:getCitirePrecedenta(modal.id)?'var(--t7)':'#fff'}}
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Index nou (mc)</label>
                    <input type="number" step="0.001" value={formData.index_nou}
                      onChange={e => setFormData({...formData, index_nou: e.target.value})}
                      style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none'}}
                      placeholder="0.000"
                      autoFocus
                    />
                  </div>
                </div>
                {formData.index_vechi && formData.index_nou && (
                  <div style={{padding:'10px',background:'var(--t7)',borderRadius:10,border:'1.5px solid var(--t5)',marginBottom:12,textAlign:'center'}}>
                    <span style={{fontSize:13,color:'var(--text2)'}}>Consum: </span>
                    <strong style={{color:'var(--t1)',fontSize:15}}>
                      {Math.max(0, parseFloat(formData.index_nou) - parseFloat(formData.index_vechi)).toFixed(3)} mc
                    </strong>
                  </div>
                )}
              </div>
            )}

            {msg && <div style={{padding:'10px',background:'#fee2e2',borderRadius:10,color:'#b91c1c',fontSize:13,marginBottom:12}}>{msg}</div>}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button onClick={() => setModal(null)} style={{padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',color:'var(--text2)'}}>Anuleaza</button>
              <button onClick={saveCitire} disabled={saving} style={{padding:13,background:'linear-gradient(135deg,var(--l3),var(--t2))',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving ? 'Se salveaza...' : '💾 Salveaza'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:item.href==='/dashboard/citiri'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
