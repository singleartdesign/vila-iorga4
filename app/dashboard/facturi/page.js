'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

export default function Facturi() {
  const [profile, setProfile] = useState(null)
  const [luni, setLuni] = useState([])
  const [lunaActuala, setLunaActuala] = useState(null)
  const [form, setForm] = useState({ valoare_factura: '', consum_facturat: '', mod_repartizare: 'egal', note: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    if (prof?.rol !== 'administrator' && prof?.rol !== 'manager') { router.push('/dashboard'); return }
    const { data: l } = await supabase.from('luni_facturare').select('*').order('an', { ascending: false }).order('luna', { ascending: false }).limit(24)
    setLuni(l || [])
    if (l && l.length > 0) {
      setLunaActuala(l[0])
      setForm({
        valoare_factura: l[0].valoare_factura?.toString() || '',
        consum_facturat: l[0].consum_facturat?.toString() || '',
        mod_repartizare: l[0].mod_repartizare || 'egal',
        note: l[0].note || ''
      })
    }
    setLoading(false)
  }

  async function salveazaFactura() {
    if (!lunaActuala) return
    const val = parseFloat(form.valoare_factura)
    const mc = parseFloat(form.consum_facturat)
    if (isNaN(val) || val <= 0) { setMsg('Introdu valoarea facturii!'); setMsgType('error'); return }
    if (isNaN(mc) || mc <= 0) { setMsg('Introdu consumul facturat!'); setMsgType('error'); return }
    setSaving(true)
    const { error } = await supabase.from('luni_facturare').update({
      valoare_factura: val,
      consum_facturat: mc,
      mod_repartizare: form.mod_repartizare,
      note: form.note,
      actualizat_la: new Date().toISOString()
    }).eq('id', lunaActuala.id)
    if (error) { setMsg('Eroare: ' + error.message); setMsgType('error') }
    else { setMsg('Factura salvata! Calculele au fost actualizate automat.'); setMsgType('success'); await loadData() }
    setSaving(false)
  }

  async function adaugaLunaNou() {
    const acum = new Date()
    let an = acum.getFullYear()
    let luna = acum.getMonth() + 1
    if (luni.length > 0) {
      const ultima = luni[0]
      luna = ultima.luna + 1
      an = ultima.an
      if (luna > 12) { luna = 1; an++ }
    }
    const { data, error } = await supabase.from('luni_facturare').insert({
      an, luna, valoare_factura: 0, consum_facturat: 0, mod_repartizare: 'egal'
    }).select().single()
    if (error) { setMsg('Eroare: ' + error.message); setMsgType('error') }
    else { await loadData(); setMsg(`Luna ${LUNI_NUME[luna]} ${an} adaugata!`); setMsgType('success') }
  }

  const pretCalculat = form.valoare_factura && form.consum_facturat
    ? (parseFloat(form.valoare_factura) / parseFloat(form.consum_facturat)).toFixed(4)
    : null

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40}}>📄</div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Facturi lunare</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{lunaActuala ? `${LUNI_NUME[lunaActuala.luna]} ${lunaActuala.an}` : ''}</div>
          </div>
        </div>
        <button onClick={adaugaLunaNou} style={{padding:'7px 12px',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + Luna noua
        </button>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        {msg && (
          <div style={{padding:'12px 16px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
            background: msgType === 'success' ? 'var(--t7)' : '#fee2e2',
            color: msgType === 'success' ? 'var(--t1)' : '#b91c1c',
            border: `1px solid ${msgType === 'success' ? 'var(--t5)' : '#fecaca'}`
          }}>{msg}</div>
        )}

        {lunaActuala && (
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:14}}>
              Factura {LUNI_NUME[lunaActuala.luna]} {lunaActuala.an}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Valoare factura (RON)</label>
                <input type="number" step="0.01" value={form.valoare_factura}
                  onChange={e => setForm({...form, valoare_factura: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none',fontWeight:700}}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Consum facturat RAGCL (mc)</label>
                <input type="number" step="0.001" value={form.consum_facturat}
                  onChange={e => setForm({...form, consum_facturat: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:15,fontFamily:'Nunito,sans-serif',outline:'none',fontWeight:700}}
                  placeholder="0.000"
                />
              </div>
            </div>

            {pretCalculat && (
              <div style={{padding:'10px 14px',background:'var(--t7)',borderRadius:10,border:'1.5px solid var(--t5)',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:'var(--text2)'}}>Pret per mc calculat:</span>
                <strong style={{color:'var(--t1)',fontSize:15}}>{pretCalculat} RON/mc</strong>
              </div>
            )}

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:8}}>Mod repartizare pierdere</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  {val:'egal', label:'Egal', desc:'Impartit la toti'},
                  {val:'proportional', label:'Proportional', desc:'Dupa consum'},
                  {val:'special', label:'Anumit proprietar', desc:'Atribuire manuala'}
                ].map(opt => (
                  <button key={opt.val} onClick={() => setForm({...form, mod_repartizare: opt.val})}
                    style={{
                      flex:1, minWidth:80, padding:'9px 8px', borderRadius:10, cursor:'pointer',
                      border: `2px solid ${form.mod_repartizare === opt.val ? 'var(--t2)' : 'var(--border)'}`,
                      background: form.mod_repartizare === opt.val ? 'var(--t7)' : '#fff',
                      color: form.mod_repartizare === opt.val ? 'var(--t1)' : 'var(--text3)'
                    }}>
                    <div style={{fontSize:11,fontWeight:700}}>{opt.label}</div>
                    <div style={{fontSize:10,marginTop:2}}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Note (optional)</label>
              <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                style={{width:'100%',padding:'10px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:13,fontFamily:'Nunito,sans-serif',outline:'none',resize:'vertical',minHeight:60}}
                placeholder="ex: Teava sparta la Ap. 3, pierdere atribuita acestuia..."
              />
            </div>

            <button onClick={salveazaFactura} disabled={saving} style={{
              width:'100%',padding:'13px',
              background:'linear-gradient(135deg,var(--l3),var(--t2))',
              border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer'
            }}>
              {saving ? 'Se salveaza...' : '💾 Salveaza factura'}
            </button>
          </div>
        )}

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Istoric facturi</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {luni.map(luna => (
              <div key={luna.id} onClick={() => { setLunaActuala(luna); setForm({ valoare_factura: luna.valoare_factura?.toString() || '', consum_facturat: luna.consum_facturat?.toString() || '', mod_repartizare: luna.mod_repartizare || 'egal', note: luna.note || '' }); window.scrollTo(0,0) }}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  background: lunaActuala?.id === luna.id ? 'var(--t7)' : 'var(--bg)',
                  borderRadius:'var(--r-sm)', cursor:'pointer',
                  border: `1px solid ${lunaActuala?.id === luna.id ? 'var(--t4)' : 'transparent'}`
                }}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{LUNI_NUME[luna.luna]} {luna.an}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{luna.consum_facturat} mc · {luna.pret_per_mc?.toFixed(2)} RON/mc</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--l2)'}}>{luna.valoare_factura?.toFixed(2)} RON</div>
                  <div style={{fontSize:10,color:'var(--text3)',textTransform:'capitalize'}}>{luna.mod_repartizare}</div>
                </div>
                {lunaActuala?.id === luna.id && <span style={{fontSize:12,color:'var(--t1)'}}>✓</span>}
              </div>
            ))}
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
