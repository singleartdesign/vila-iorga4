'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Icon from '@/lib/Icon'
import Avatar, { pregatesteAvatar } from '@/lib/Avatar'
import { useRouter } from 'next/navigation'

const CULORI = ['#0f8b8d','#7a5cc4','#e08a3c','#9aa5ad','#3d7fd1']

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
  const [email, setEmail] = useState('')
  const [parola, setParola] = useState({ noua: '', confirma: '' })
  const [msgParola, setMsgParola] = useState({ text: '', tip: 'error' })
  const [msgPoza, setMsgPoza] = useState({ text: '', tip: 'error' })
  const [incarcPoza, setIncarcPoza] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    setEmail(user.email || '')
    if (prof?.rol !== 'administrator') { setLoading(false); return }
    const { data: util } = await supabase.from('profiles').select('*, apartamente(numar, proprietar_nume)').order('rol')
    const { data: apt } = await supabase.from('apartamente').select('*').eq('activ', true).order('numar')
    setUtilizatori(util || [])
    setApartamente(apt || [])
    setLoading(false)
  }

  async function schimbaParola() {
    if (parola.noua.length < 8) { setMsgParola({ text: 'Parola trebuie sa aiba cel putin 8 caractere.', tip: 'error' }); return }
    if (parola.noua !== parola.confirma) { setMsgParola({ text: 'Cele doua parole nu coincid.', tip: 'error' }); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: parola.noua })
    if (error) setMsgParola({ text: 'Eroare: ' + error.message, tip: 'error' })
    else { setMsgParola({ text: 'Parola a fost schimbata. Data viitoare te loghezi cu parola noua.', tip: 'success' }); setParola({ noua: '', confirma: '' }) }
    setSaving(false)
  }

  function caleAvatar(url) {
    const i = url ? url.indexOf('/avatare/') : -1
    return i >= 0 ? url.slice(i + 9).split('?')[0] : null
  }

  async function incarcaPoza(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile) return
    setIncarcPoza(true); setMsgPoza({ text: '', tip: 'error' })
    try {
      const blob = await pregatesteAvatar(file)
      const cale = `${profile.id}/${Date.now()}.jpg`
      const { error: errUp } = await supabase.storage.from('avatare').upload(cale, blob, { contentType: 'image/jpeg' })
      if (errUp) throw errUp
      const { data: { publicUrl } } = supabase.storage.from('avatare').getPublicUrl(cale)
      const vechi = caleAvatar(profile.avatar_url)
      const { error: errUpd } = await supabase.from('profiles').update({ avatar_url: publicUrl, actualizat_la: new Date().toISOString() }).eq('id', profile.id)
      if (errUpd) throw errUpd
      if (vechi) await supabase.storage.from('avatare').remove([vechi])
      setProfile({ ...profile, avatar_url: publicUrl })
      setUtilizatori(u => u.map(x => x.id === profile.id ? { ...x, avatar_url: publicUrl } : x))
      setMsgPoza({ text: 'Poza a fost salvata.', tip: 'success' })
    } catch (err) {
      setMsgPoza({ text: 'Nu am putut salva poza: ' + (err.message || err), tip: 'error' })
    }
    setIncarcPoza(false)
  }

  async function stergePoza() {
    if (!profile?.avatar_url) return
    setIncarcPoza(true)
    const vechi = caleAvatar(profile.avatar_url)
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    if (!error && vechi) await supabase.storage.from('avatare').remove([vechi])
    if (error) setMsgPoza({ text: 'Eroare: ' + error.message, tip: 'error' })
    else { setProfile({ ...profile, avatar_url: null }); setUtilizatori(u => u.map(x => x.id === profile.id ? { ...x, avatar_url: null } : x)); setMsgPoza({ text: 'Poza a fost stearsa.', tip: 'success' }) }
    setIncarcPoza(false)
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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'transparent'}}>
      <div style={{textAlign:'center'}}><div style={{display:'flex',justifyContent:'center',color:'var(--t2)'}}><Icon name="setari" size={44} stroke={1.3} /></div><div style={{color:'var(--text3)',fontWeight:600,marginTop:8}}>Se incarca...</div></div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'transparent',fontFamily:'var(--font)',paddingBottom:80}}>

      <div style={{background:'var(--hdr)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <a href="/dashboard" style={{color:'rgba(255,255,255,0.8)',textDecoration:'none',fontSize:20}}>←</a>
          <div>
            <div style={{color:'#fff',fontWeight:600,fontSize:16,fontFamily:'var(--font-display)'}}>Setari</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>Vila Iorga 4</div>
          </div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)',fontWeight:600}}>{profile?.nume}</div>
      </div>

      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:12,maxWidth:700,margin:'0 auto'}}>

        {msg && (
          <div style={{padding:'12px 16px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
            background: msgType === 'success' ? 'var(--t7)' : 'var(--err-bg)',
            color: msgType === 'success' ? 'var(--t1)' : '#b91c1c',
            border: `1px solid ${msgType === 'success' ? 'var(--t5)' : '#fecaca'}`
          }}>{msg}</div>
        )}

        {/* CONTUL MEU */}
        <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:500,marginBottom:14}}>Contul meu</div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <label style={{position:'relative',cursor:incarcPoza?'wait':'pointer',flexShrink:0}} title="Schimba poza">
              <Avatar url={profile?.avatar_url} nume={profile?.nume} size={76} color={CULORI[((profile?.apartament_id||4)-1)%5]} style={{opacity:incarcPoza?0.5:1}} />
              <span style={{position:'absolute',right:-2,bottom:-2,width:30,height:30,borderRadius:'50%',background:'var(--btn)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 0 3px rgba(255,255,255,0.9)'}}><Icon name="poza" size={15} /></span>
              <input type="file" accept="image/*" onChange={incarcaPoza} disabled={incarcPoza} style={{display:'none'}} />
            </label>
            <div style={{minWidth:0}}>
              <div style={{fontSize:16,fontWeight:500}}>{profile?.nume}</div>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis'}}>{email}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <label style={{padding:'6px 12px',borderRadius:999,background:'#fff',fontSize:12,cursor:'pointer',color:'var(--t1)'}}>
                  {incarcPoza ? 'Se incarca...' : profile?.avatar_url ? 'Schimba poza' : 'Adauga poza'}
                  <input type="file" accept="image/*" onChange={incarcaPoza} disabled={incarcPoza} style={{display:'none'}} />
                </label>
                {profile?.avatar_url && <button onClick={stergePoza} disabled={incarcPoza} style={{padding:'6px 12px',background:'transparent',border:'1px solid rgba(11,37,69,0.25)',fontSize:12,cursor:'pointer',color:'var(--text2)'}}>Sterge</button>}
              </div>
            </div>
          </div>
          {msgPoza.text && <div style={{padding:'10px 12px',borderRadius:14,fontSize:12,marginBottom:12,background:msgPoza.tip === 'success' ? 'var(--t7)' : 'var(--err-bg)',color:msgPoza.tip === 'success' ? 'var(--t1)' : '#b91c1c'}}>{msgPoza.text}</div>}
          <div style={{fontSize:12,fontWeight:500,color:'var(--text2)',marginBottom:8}}>Schimba parola</div>
          <input type="password" autoComplete="new-password" placeholder="Parola noua (minim 8 caractere)" value={parola.noua} onChange={e => setParola({...parola, noua: e.target.value})} style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:15,fontFamily:'var(--font)',outline:'none',marginBottom:10}} />
          <input type="password" autoComplete="new-password" placeholder="Repeta parola noua" value={parola.confirma} onChange={e => setParola({...parola, confirma: e.target.value})} style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:15,fontFamily:'var(--font)',outline:'none',marginBottom:10}} />
          {msgParola.text && <div style={{padding:'10px 12px',borderRadius:10,fontSize:12,fontWeight:600,marginBottom:10,background:msgParola.tip === 'success' ? 'var(--t7)' : 'var(--err-bg)',color:msgParola.tip === 'success' ? 'var(--t1)' : '#b91c1c'}}>{msgParola.text}</div>}
          <button className="btn-cta" onClick={schimbaParola} disabled={saving} style={{width:'100%',padding:'12px',background:'var(--btn)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            {saving ? 'Se salveaza...' : 'Salveaza parola noua'}
          </button>
        </div>

        {profile?.rol === 'administrator' && <>
        {/* UTILIZATORI */}
        <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:500}}>Utilizatori si roluri</div>
            <button onClick={() => { setModalInvite(true); setMsg('') }} style={{padding:'7px 14px',background:'var(--btn)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>
              + Adauga
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {utilizatori.map((util, i) => (
              <div key={util.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--bg)',borderRadius:'var(--r-sm)'}}>
                <Avatar url={util.avatar_url} nume={util.nume} size={40} color={rolColors[util.rol] || '#94a3b8'} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{util.nume}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{util.email}</div>
                  {util.apartamente && <div style={{fontSize:11,color:'var(--t1)',fontWeight:600}}>Ap. {util.apartamente.numar}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                  <span style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:12,background:rolColors[util.rol]+'22',color:rolColors[util.rol]}}>
                    {rolLabels[util.rol]}
                  </span>
                  {util.id !== profile?.id && (
                    <button onClick={() => { setModalRol(util); setMsg('') }} style={{fontSize:10,fontWeight:500,padding:'3px 8px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--text2)'}}>
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
          <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:500,marginBottom:6,color:'var(--text)'}}>
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
        <div style={{background:'var(--card)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:'var(--r)',padding:'16px',boxShadow:'var(--shadow)',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:500,marginBottom:12}}>Informatii Vila</div>
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
        </>}

      </div>

      {/* MODAL INVITA */}
      {modalInvite && (
        <div onClick={() => setModalInvite(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'var(--sheet)',borderRadius:'32px 32px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:500,marginBottom:16}}>Adauga utilizator nou</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Nume complet</label>
                <input value={inviteData.nume} onChange={e => setInviteData({...inviteData, nume: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:14,fontFamily:'var(--font)',outline:'none'}}
                  placeholder="ex: Ionescu Maria"
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Email</label>
                <input type="email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:14,fontFamily:'var(--font)',outline:'none'}}
                  placeholder="email@exemplu.ro"
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Rol</label>
                <select value={inviteData.rol} onChange={e => setInviteData({...inviteData, rol: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:14,fontFamily:'var(--font)',outline:'none',background:'var(--glass)'}}>
                  <option value="proprietar">Proprietar</option>
                  <option value="manager">Manager</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:5}}>Apartament asociat</label>
                <select value={inviteData.apartament_id} onChange={e => setInviteData({...inviteData, apartament_id: e.target.value})}
                  style={{width:'100%',padding:'11px',border:'1px solid rgba(29,28,27,0.08)',background:'var(--glass)',borderRadius:16,fontSize:14,fontFamily:'var(--font)',outline:'none',background:'var(--glass)'}}>
                  <option value="">Fara apartament</option>
                  {apartamente.map(apt => (
                    <option key={apt.id} value={apt.id}>Ap. {apt.numar} - {apt.proprietar_nume}</option>
                  ))}
                </select>
              </div>
            </div>
            {msg && <div style={{marginTop:10,padding:'10px',background: msgType==='success'?'var(--t7)':'var(--err-bg)',borderRadius:10,color:msgType==='success'?'var(--t1)':'#b91c1c',fontSize:13}}>{msg}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>
              <button onClick={() => setModalInvite(false)} style={{padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:500,cursor:'pointer'}}>Anuleaza</button>
              <button className="btn-cta" onClick={inviteUser} disabled={saving} style={{padding:13,background:'var(--btn)',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                {saving ? 'Se creeaza...' : '+ Creeaza cont'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCHIMBA ROL */}
      {modalRol && (
        <div onClick={() => setModalRol(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'var(--sheet)',borderRadius:'32px 32px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:500}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 20px'}}></div>
            <div style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:500,marginBottom:4}}>Schimba rol</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:16}}>{modalRol.nume}</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {['proprietar','manager','administrator'].map(rol => (
                <button key={rol} onClick={() => schimbaRol(modalRol.id, rol, modalRol.apartament_id)}
                  style={{
                    padding:'12px 16px',borderRadius:10,border:`2px solid ${modalRol.rol === rol ? rolColors[rol] : 'var(--border)'}`,
                    background: modalRol.rol === rol ? rolColors[rol]+'15' : 'var(--glass)',
                    color: modalRol.rol === rol ? rolColors[rol] : 'var(--text2)',
                    fontSize:13,fontWeight:500,cursor:'pointer',textAlign:'left',
                    display:'flex',alignItems:'center',justifyContent:'space-between'
                  }}>
                  <span>{rolLabels[rol]}</span>
                  {modalRol.rol === rol && <span>✓ Activ</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setModalRol(null)} style={{width:'100%',padding:13,background:'var(--bg)',border:'none',borderRadius:12,fontSize:13,fontWeight:500,cursor:'pointer'}}>Inchide</button>
          </div>
        </div>
      )}

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--glass)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.8)',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:100}}>
        {[{icon:'dashboard',label:'Dashboard',href:'/dashboard'},{icon:'citiri',label:'Citiri',href:'/dashboard/citiri'},{icon:'plati',label:'Plati',href:'/dashboard/plati'},{icon:'grafice',label:'Grafice',href:'/dashboard/grafice'},{icon:'setari',label:'Setari',href:'/dashboard/setari'}].map(item => (
          <a key={item.href} href={item.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',minWidth:56}}>
            <span style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:item.href==='/dashboard/setari'?'var(--btn)':'rgba(255,255,255,0.65)',color:item.href==='/dashboard/setari'?'#fff':'var(--text2)',border:'1px solid rgba(255,255,255,0.8)'}}><Icon name={item.icon} size={19} /></span>
            <span style={{fontSize:10,fontWeight:500,color:item.href==='/dashboard/setari'?'var(--t1)':'var(--text3)'}}>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
