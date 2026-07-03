'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

export default function Grafice() {
  const [profile, setProfile] = useState(null)
  const [luni, setLuni] = useState([])
  const [loading, setLoading] = useState(true)
  const [perioada, setPerioada] = useState(12)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data: l } = await supabase.from('luni_facturare').select('*').order('an').order('luna').limit(36)
    setLuni(l || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40}}>📈</div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  const luniAfisate = luni.slice(-perioada)
  const maxConsum = Math.max(...luniAfisate.map(l => l.consum_facturat), 1)
  const maxValoare = Math.max(...luniAfisate.map(l => l.valoare_factura), 1)
  const maxPret = Math.max(...luniAfisate.map(l => parseFloat(l.pret_per_mc) || 0), 1)

  const avgConsum = luni.length ? (luni.reduce((s,l) => s + l.consum_facturat, 0) / luni.length).toFixed(1) : 0
  const avgValoare = luni.length ? (luni.reduce((s,l) => s + l.valoare_factura, 0) / luni.length).toFixed(0) : 0
  const minConsum = luni.length ? Math.min(...luni.map(l => l.consum_facturat)) : 0
  const maxConsumTotal = luni.length ? Math.max(...luni.map(l => l.consum_facturat)) : 0

  function BarChart({ data, maxVal, colorActive, colorInactive, unit, height = 140 }) {
    return (
      <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
        <div style={{display:'flex', alignItems:'flex-end', gap:6, height, minWidth: data.length * 36, padding:'8px 4px 0'}}>
          {data.map((item, i) => {
            const h = Math.max((item.val / maxVal) * (height - 30), 4)
            const isLast = i === data.length - 1
            return (
              <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:30}}>
                <div style={{fontSize:9, color:isLast ? colorActive : 'var(--text3)', fontWeight:700, height:14, display:'flex', alignItems:'flex-end'}}>
                  {isLast ? item.val.toFixed(unit === 'RON' ? 0 : 1) : ''}
                </div>
                <div style={{
                  width:28, borderRadius:'5px 5px 0 0',
                  background: isLast ? colorActive : colorInactive,
                  height: h,
                  transition:'height 0.4s'
                }}></div>
                <div style={{fontSize:9, color:'var(--text3)', fontWeight:600, textAlign:'center', lineHeight:1.2, width:30}}>
                  {LUNI_NUME[item.luna]}
                  {(i === 0 || item.an !== data[i-1]?.an) && (
                    <div style={{fontSize:8, color:'var(--l4)', fontWeight:700}}>{String(item.an).slice(2)}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const consumData = luniAfisate.map(l => ({ val: l.consum_facturat, luna: l.luna, an: l.an }))
  const valoareData = luniAfisate.map(l => ({ val: l.valoare_factura, luna: l.luna, an: l.an }))
  const pretData = luniAfisate.map(l => ({ val: parseFloat(l.pret_per_mc) || 0, luna: l.luna, an: l.an }))

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', fontFamily:'Nunito,sans-serif', paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)', padding:'14px 20px', display:'flex', alignItems:'center', gap:10}}>
        <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)', textDecoration:'none', fontSize:20}}>←</a>
        <div>
          <div style={{color:'#fff', fontWeight:800, fontSize:16, fontFamily:'Sora,sans-serif'}}>Grafice si Statistici</div>
          <div style={{color:'rgba(255,255,255,0.7)', fontSize:11}}>{luni.length} luni de date disponibile</div>
        </div>
      </div>

      <div style={{padding:'14px', display:'flex', flexDirection:'column', gap:12, maxWidth:700, margin:'0 auto'}}>

        {/* PERIOADA SELECTOR */}
        <div style={{background:'#fff', borderRadius:'var(--r)', padding:'12px 14px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <div style={{fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:8}}>Perioada afisata</div>
          <div style={{display:'flex', gap:8}}>
            {[6, 12, 24, luni.length].map(p => (
              <button key={p} onClick={() => setPerioada(p)} style={{
                flex:1, padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer',
                background: perioada === p ? 'linear-gradient(135deg,var(--l3),var(--t2))' : 'var(--bg)',
                color: perioada === p ? '#fff' : 'var(--text3)',
                fontSize:12, fontWeight:700
              }}>
                {p === luni.length ? 'Tot' : `${p}L`}
              </button>
            ))}
          </div>
        </div>

        {/* STATISTICI */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          {[
            {label:'Medie consum', val:avgConsum, unit:'mc/luna', color:'var(--t1)'},
            {label:'Medie factura', val:avgValoare, unit:'RON/luna', color:'var(--l2)'},
            {label:'Min consum', val:minConsum, unit:'mc', color:'var(--t2)'},
            {label:'Max consum', val:maxConsumTotal, unit:'mc', color:'#f97316'},
          ].map(s => (
            <div key={s.label} style={{background:'#fff', borderRadius:'var(--r)', padding:'14px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', textAlign:'center'}}>
              <div style={{fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:22, fontWeight:800, color:s.color, fontFamily:'Sora,sans-serif'}}>{s.val}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>{s.unit}</div>
            </div>
          ))}
        </div>

        {/* GRAFIC CONSUM */}
        <div style={{background:'#fff', borderRadius:'var(--r)', padding:'16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:700}}>Consum facturat (mc)</div>
            <div style={{fontSize:11, color:'var(--text3)'}}>← scroll</div>
          </div>
          <BarChart data={consumData} maxVal={maxConsum} colorActive="var(--t1)" colorInactive="rgba(20,184,166,0.25)" unit="mc" />
        </div>

        {/* GRAFIC VALOARE */}
        <div style={{background:'#fff', borderRadius:'var(--r)', padding:'16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:700}}>Valoare facturi (RON)</div>
            <div style={{fontSize:11, color:'var(--text3)'}}>← scroll</div>
          </div>
          <BarChart data={valoareData} maxVal={maxValoare} colorActive="var(--l2)" colorInactive="rgba(139,92,246,0.2)" unit="RON" />
        </div>

        {/* GRAFIC PRET */}
        <div style={{background:'#fff', borderRadius:'var(--r)', padding:'16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:700}}>Pret per mc (RON)</div>
            <div style={{fontSize:11, color:'var(--text3)'}}>← scroll</div>
          </div>
          <BarChart data={pretData} maxVal={maxPret} colorActive="#f97316" colorInactive="rgba(249,115,22,0.2)" unit="RON" height={120} />
        </div>

        {/* LISTA TOATE LUNILE */}
        <div style={{background:'#fff', borderRadius:'var(--r)', padding:'16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:700, marginBottom:12}}>Toate lunile</div>
          <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:350, overflowY:'auto'}}>
            {[...luni].reverse().map(luna => {
              const pct = (luna.consum_facturat / maxConsumTotal) * 100
              return (
                <div key={luna.id} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--bg)', borderRadius:'var(--r-sm)'}}>
                  <div style={{width:54, fontSize:11, fontWeight:700, color:'var(--text2)', flexShrink:0}}>
                    {LUNI_NUME[luna.luna]} {String(luna.an).slice(2)}
                  </div>
                  <div style={{flex:1, height:8, background:'rgba(148,163,184,0.2)', borderRadius:4, overflow:'hidden'}}>
                    <div style={{height:'100%', background:'linear-gradient(90deg,var(--t4),var(--t2))', borderRadius:4, width:`${pct}%`}}></div>
                  </div>
                  <div style={{fontSize:11, fontWeight:700, color:'var(--t1)', width:32, textAlign:'right', flexShrink:0}}>{luna.consum_facturat}mc</div>
                  <div style={{fontSize:11, color:'var(--text3)', width:58, textAlign:'right', flexShrink:0}}>{luna.valoare_factura?.toFixed(0)} RON</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-around', padding:'8px 0 20px', zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10, fontWeight:700, color:item.href==='/dashboard/grafice'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
