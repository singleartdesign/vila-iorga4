'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CULORI = ['#e07b39','#2563a8','#059669','#7c3aed','#b91c1c']

export default function Setari() {
  const [profile, setProfile] = useState(null)
  const [utilizatori, setUtilizatori] = useState([])
  const [apartamente, setApartamente] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalInvite, setModalInvite] = useState(false)
  const [modalRol, setModalRol] = useState(null)
  const [inviteData, setInviteData] = useState({ email: '', nume: '', rol: 'proprietar', apartament_id: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('error')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    if (prof?.rol !== 'administrator') { router.push('/dashboard'); return }
    const { data: util } = await supabase.from('profiles').select('*, apartamente(numar, proprietar_nume)').order('rol')
    const { data: apt } = await supabase.from('apartamente').select('*').eq('activ', true).order('numar')
    setUtilizatori(util || [])
    setApartamente(apt || [])
    setLoading(false)
  }

  async function schimbaRol(userId, rolNou, apartamentId) {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      rol: rolNou,
      apartament_id: apartamentId || null,
      actualizat_la: new Date().toISOString()
    }).eq('id', userId)
    if (error) { setMsg('Eroare: ' + error.message); setMsgType('error') }
    else { setMsg('Rolul a fost actualizat cu succes!'); setMsgType('success'); setModalRol(null); await loadData() }
    setSaving(false)
  }

  async function inviteUser() {
    if (!inviteData.email || !inviteData.nume) { setMsg('Completeaza email si nume!'); setMsgType('error'); return }
    setSaving(true)
    setMsg('')
    const { data, error } = await supabase.auth.admin?.inviteUserByEmail
      ? { error: { message: 'Foloseste Supabase Dashboard pentru invitatie' } }
      : { error: null }

    // Cream userul direct (pentru demo, in productie se foloseste invite)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteData.email,
      password: Math.random().toString(36).slice(-10) + 'A1!',
      options: { data: { nume: inviteData.nume } }
    })

    if (authError) {
      setMsg('Eroare creare cont: ' + authError.message)
      setMsgType('error')
    } else if (authData.user) {
      const { error: profError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: inviteData.email,
        nume: inviteData.nume,
        rol: inviteData.rol,
        apartament_id: inviteData.apartament_id ? parseInt(inviteData.apartament_id) : null
      })
      if (profError) { setMsg('Eroare profil: ' + profError.message); setMsgType('error') }
      else {
        setMsg('Contul a fost creat! Utilizatorul trebuie sa isi reseteze parola.')
        setMsgType('success')
        setModalInvite(false)
        setInviteData({ email: '', nume: '', rol: 'proprietar', apartament_id: '' })
        await loadData()
      }
    }
    setSaving(false)
  }

  const rolColors = { administrator: '#7c3aed', manager: '#0369a1', proprietar: '#059669' }
  const rolLabels = { administrator: 'Administrator', manager: 'Manager', proprietar: 'Proprietar' }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:40}}>⚙️</div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'Nunito,sans-serif',paddingBottom:80}}>

      <div style={{background:'linear-gradient(135deg,#7c3aed,#0d9488)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,fontFamily:'Sora,sans-serif'}}>Setari</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>Vila Iorga 4</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600}}>{profile?.nume}</div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        {msg && (
          <div style={{padding:'12px 16px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
            background: msgType === 'success' ? 'var(--t7)' : '#fee2e2',
            color: msgType === 'success' ? 'var(--t1)' : '#b91c1c',
            border: `1px solid ${msgType === 'success' ? 'var(--t5)' : '#fecaca'}`
          }}>{msg}</div>
        )}

        {/* UTILIZATORI */}
        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700}}>Utilizatori si roluri</div>
            <button onClick={() => { setModalInvite(true); setMsg('') }} style={{padding:'7px 14px',background:'linear-gradient(135deg,var(--l3),var(--t2))',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Adauga
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {utilizatori.map((util, i) => (
              <div key={util.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:rolColors[util.rol] || '#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:12,flexShrink:0}}>
                  {util.nume.substring(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{util.nume}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{util.email}</div>
                  {util.apartamente && <div style={{fontSize:11,color:'var(--t1)',fontWeight:600}}>Ap. {util.apartamente.numar}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:12,background:rolColors[util.rol]+'22',color:rolColors[util.rol]}}>
                    {rolLabels[util.rol]}
                  </span>
                  {util.id !== profile?.id && (
                    <button onClick={() => { setModalRol(util); setMsg('') }} style={{fontSize:10,fontWeight:700,padding:'3px 8px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--text2)'}}>
                      Schimba rol
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INFO SCHIMBARE MANAGER */}
        <div style={{background:'linear-gradient(135deg,var(--t7),var(--l7))',borderRadius:'var(--r)',padding:'14px 16px',border:'1.5px solid var(--t5)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:700,marginBottom:6,color:'var(--text)'}}>
            Cum schimbi managerul?
          </div>
          <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>
            1. Gaseste utilizatorul care gestioneaza acum facturile si platile<br/>
            2. Click pe "Schimba rol" si seteaza-l pe "Proprietar"<br/>
            3. Gaseste noul manager si seteaza-l pe "Manager"<br/>
            <strong style={{color:'var(--t1)'}}>Istoricul nu se pierde.</strong> Toate datele introduse de vechiul manager raman in sistem.
          </div>
        </div>

        {/* INFO VILA */}
        <div style={{background:'#fff',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,marginBottom:12}}>Informatii Vila</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
              <span style={{fontSize:12,color:'var(--text3)'}}>Denumire</span>
              <strong style={{fontSize:12}}>Vila Iorga 4</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
              <span style={{fontSize:12,color:'var(--text3)'}}>Numar apartamente</span>
              <strong style={{fontSize:12}}>5</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
              <span style={{fontSize:12,color:'var(--text3)'}}>Administrator</span>
              <strong style={{fontSize:12}}>Vlad Stefan</strong>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
              <span style={{fontSize:12,color:'var(--text3)'}}>Istoric disponibil</span>
              <strong style={{fontSize:12,color:'var(--t1)'}}>Iul 2023 - prezent</strong>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL INVITA */}
      {modalInvite && (
        <div onClick={() => setModalInvite(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:17,fontWeight:700,marginBottom:16}}>Adauga utilizator nou</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Nume complet</label>
                <input value={inviteData.nume} onChange={e => setInviteData({...inviteData, nume: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:'Nunito,sans-serif',outline:'none'}}
                  placeholder="ex: Ionescu Maria"
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Email</label>
                <input type="email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:'Nunito,sans-serif',outline:'none'}}
                  placeholder="email@exemplu.ro"
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Rol</label>
                <select value={inviteData.rol} onChange={e => setInviteData({...inviteData, rol: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:'Nunito,sans-serif',outline:'none',background:'#fff'}}>
                  <option value="proprietar">Proprietar</option>
                  <option value="manager">Manager</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Apartament asociat</label>
                <select value={inviteData.apartament_id} onChange={e => setInviteData({...inviteData, apartament_id: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:'Nunito,sans-serif',outline:'none',background:'#fff'}}>
                  <option value="">Fara apartament</option>
                  {apartamente.map(apt => (
                    <option key={apt.id} value={apt.id}>Ap. {apt.numar} - {apt.proprietar_nume}</option>
                  ))}
                </select>
              </div>
            </div>
            {msg && <div style={{marginTop:10,padding:'10px',background: msgType==='success'?'var(--t7)':'#fee2e2',borderRadius:10,color:msgType==='success'?'var(--t1)':'#b91c1c',fontSize:13}}>{msg}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>
              <button onClick={() => setModalInvite(false)} style={{padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>Anuleaza</button>
              <button onClick={inviteUser} disabled={saving} style={{padding:13,background:'linear-gradient(135deg,var(--l3),var(--t2))',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving ? 'Se creeaza...' : '+ Creeaza cont'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCHIMBA ROL */}
      {modalRol && (
        <div onClick={() => setModalRol(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:17,fontWeight:700,marginBottom:4}}>Schimba rol</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:16}}>{modalRol.nume}</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {['proprietar','manager','administrator'].map(rol => (
                <button key={rol} onClick={() => schimbaRol(modalRol.id, rol, modalRol.apartament_id)}
                  style={{
                    padding:'12px 16px',borderRadius:10,border:`2px solid ${modalRol.rol === rol ? rolColors[rol] : 'var(--border)'}`,
                    background: modalRol.rol === rol ? rolColors[rol]+'15' : '#fff',
                    color: modalRol.rol === rol ? rolColors[rol] : 'var(--text2)',
                    fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'left',
                    display:'flex',alignItems:'center',justifyContent:'space-between'
                  }}>
                  <span>{rolLabels[rol]}</span>
                  {modalRol.rol === rol && <span>✓ Activ</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setModalRol(null)} style={{width:'100%',padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>Inchide</button>
          </div>
        </div>
      )}

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'📊',label:'Dashboard',href:'/dashboard'},{icon:'🔢',label:'Citiri',href:'/dashboard/citiri'},{icon:'💳',label:'Plati',href:'/dashboard/plati'},{icon:'📈',label:'Grafice',href:'/dashboard/grafice'},{icon:'⚙️',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:item.href==='/dashboard/setari'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
