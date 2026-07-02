'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LUNI_NUME = ['','Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

export default function Grafice() {
  const [profile, setProfile] = useState(null)
  const [luni, setLuni] = useState([])
  const [loading, setLoading] = useState(true)
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

  const maxConsum = Math.max(...luni.map(l => l.consum_facturat), 1)
  const maxValoare = Math.max(...luni.map(l => l.valoare_factura), 1)
  const maxPret = Math.max(...luni.map(l => parseFloat(l.pret_per_mc) || 0), 1)

  function BarChart({ data, maxVal, color1, color2, label, unit }) {
    return (
      <div>
        <div style={{display:'flex',alignItems:'flex-end',gap:3,height:120,padding:'0 2px'}}>
          {data.map((item, i) => {
            const h = (item.val / maxVal) * 100
            const isLast = i === data.length - 1
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                {isLast && <div style={{fontSize:8,color:color1,fontWeight:700}}>{item.val.toFixed(1)}</div>}
                <div style={{
                  width:'100%', borderRadius:'3px 3px 0 0',
                  background: isLast ? `linear-gradient(180deg,${color1},${color2})` : 'rgba(148,163,184,0.25)',
                  height:`${Math.max(h, 3)}%`, minHeight:3
                }}></div>
                <div style={{fontSize:8,color:'var(--text3)',fontWeight:600,textAlign:'center',lineHeight:1.1}}>
                  {LUNI_NUME[item.luna]}
                  {item.an !== data[i-1]?.an && <div style={{fontSize:7,color:'var(--l4)'}}>{item.an}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const consumData = luni.map(l => ({ val: l.consum_facturat, luna: l.luna, an: l.an }))
  const valoareData = luni.map(l => ({ val: l.valoare_factura, luna: l.luna, an: l.an }))
  const pretData = luni.map(l => ({ val: parseFloat(l.pret_per_mc) || 0, luna: l.luna, an: l.an }))

  const avgConsum = luni.length ? (luni.reduce((s,l) => s + l.consum_facturat, 0) / luni.length).toFixed(1) : 0
  const avgValoare = luni.length ? (luni.reduce((s,l) => s + l.valoare_factura, 0) / luni.length).toFixed(0) : 0
  const minConsum = luni.length ? Math.min(...luni.map(l => l.consum_facturat)) : 0
  const maxConsumVal = luni.length ? Math.max(...luni.map(l => l.consum_facturat)) : 0

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
        <div>
          <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Grafice si Statistici</div>
          <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>{luni.length} luni de date</div>
        </div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Medie consum</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--t1)',fontFamily:'Sora,sans-serif'}}>{avgConsum}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>mc/luna</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Medie factura</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--l2)',fontFamily:'Sora,sans-serif'}}>{avgValoare}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>RON/luna</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Min consum</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--t2)',fontFamily:'Sora,sans-serif'}}>{minConsum}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>mc</div>
          </div>
          <div style={{background:'#fff',borderRadius:'var(--r)',padding:'14px',boxShadow:'var(--shadow)',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Max consum</div>
            <div style={{fontSize:22,fontWeight:800,color:'#f97316',fontFamily:'Sora,sans-serif'}}>{maxConsumVal}</div>
            <div style={{fontSize:10,color:'var(--text3)'}}>mc</div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text)'}}>Consum facturat lunar (mc)</div>
          <BarChart data={consumData} maxVal={maxConsum} color1="var(--t2)" color2="var(--t1)" unit="mc" />
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:10,color:'var(--text3)'}}>
            <span>Iul 2023</span><span style={{color:'var(--t1)',fontWeight:700}}>Luna curenta</span><span>Azi</span>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text)'}}>Valoare facturi lunare (RON)</div>
          <BarChart data={valoareData} maxVal={maxValoare} color1="var(--l3)" color2="var(--l2)" unit="RON" />
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:10,color:'var(--text3)'}}>
            <span>Iul 2023</span><span style={{color:'var(--l2)',fontWeight:700}}>Luna curenta</span><span>Azi</span>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text)'}}>Pret per mc (RON)</div>
          <BarChart data={pretData} maxVal={maxPret} color1="#f97316" color2="#ea580c" unit="RON" />
          <div style={{fontSize:11,color:'var(--text3)',marginTop:8,textAlign:'center'}}>
            Pretul a crescut de la ~11.42 RON/mc (2023) la ~17 RON/mc (2026) datorita TVA si indexarilor.
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700,marginBottom:12}}>Toate lunile - detaliu</div>
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:300,overflowY:'auto'}}>
            {[...luni].reverse().map(luna => (
              <div key={luna.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
                <div style={{width:50,fontSize:11,fontWeight:700,color:'var(--text2)',flexShrink:0}}>
                  {LUNI_NUME[luna.luna]} {luna.an}
                </div>
                <div style={{flex:1,height:6,background:'rgba(148,163,184,0.2)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,var(--t4),var(--t2))',borderRadius:3,width:`${(luna.consum_facturat/maxConsumVal)*100}%`}}></div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t1)',width:35,textAlign:'right'}}>{luna.consum_facturat}mc</div>
                <div style={{fontSize:11,color:'var(--text3)',width:55,textAlign:'right'}}>{luna.valoare_factura?.toFixed(0)} RON</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:item.href==='/dashboard/grafice'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
