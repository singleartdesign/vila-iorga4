'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Icon from '@/lib/Icon'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email sau parolă incorectă.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const pill = { display: 'flex', alignItems: 'center', gap: 12, padding: 6, paddingRight: 8, borderRadius: 999, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)', marginBottom: 14 }
  const icon = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#0b2545', flexShrink: 0 }
  const input = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: '#0b2545', padding: '10px 0', minWidth: 0 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* decor: sfera de apa, turcoaz spre bleumarin */}
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', right: 'calc(50% - 330px)', top: 'calc(50% - 250px)', background: 'radial-gradient(circle at 30% 28%, #e6fbfb 0%, #5cc8cf 38%, #1a6f9a 72%, #0b2545 100%)', boxShadow: '0 40px 80px rgba(11,37,69,0.28)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 36, padding: '34px 30px 28px', background: 'rgba(240,247,249,0.5)', backdropFilter: 'blur(30px) saturate(160%)', WebkitBackdropFilter: 'blur(30px) saturate(160%)', border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 30px 80px rgba(11,37,69,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 44 }}>
          <div style={{ fontSize: 18, color: '#5b6b78', fontWeight: 400 }}>Vila Iorga 4</div>
          <div style={{ fontSize: 18, color: '#0b2545', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6 }}>Apă <Icon name="picatura" size={20} style={{ color: '#1a9fb0' }} /></div>
        </div>

        <div style={{ fontSize: 40, fontWeight: 400, color: '#0b2545', letterSpacing: '-0.02em', marginBottom: 26 }}>Intră în cont</div>

        <form onSubmit={handleLogin}>
          <div style={pill}>
            <div style={icon}><Icon name="arond" size={18} /></div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adresa de email" required autoComplete="email" style={input} />
          </div>
          <div style={pill}>
            <div style={icon}><Icon name="cheie" size={18} /></div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="parola" required autoComplete="current-password" style={input} />
            <a href="mailto:office@single.art?subject=Parola%20Iorga%204" style={{ padding: '9px 16px', borderRadius: 999, background: '#fff', color: '#0b2545', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>Am uitat</a>
          </div>

          {error && <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 16, color: '#b4410b', fontSize: 14, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22 }}>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#5b6b78', maxWidth: 230 }}>
              Citiri apometre, facturi și plăți pentru vecinii din Str. Nicolae Iorga nr. 4. 
            </div>
            <button type="submit" disabled={loading} aria-label="Intră" style={{ display: 'flex', alignItems: 'center', gap: 0, border: 'none', background: 'transparent', cursor: loading ? 'wait' : 'pointer', padding: 0 }}>
              <span style={{ height: 52, padding: '0 20px', display: 'flex', alignItems: 'center', borderRadius: 999, background: 'var(--btn)', color: '#fff', fontSize: 15, fontWeight: 400 }}>{loading ? 'Se conectează…' : 'Intră'}</span>
              <span style={{ width: 52, height: 52, marginLeft: -14, borderRadius: '50%', background: 'var(--btn)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>›</span>
            </button>
          </div>
        </form>

        <div style={{ marginTop: 34, textAlign: 'center', fontSize: 11, color: '#7d8c97' }}>
          Versiunea {process.env.NEXT_PUBLIC_APP_VERSION} din {process.env.NEXT_PUBLIC_BUILD_DATE}{process.env.NEXT_PUBLIC_COMMIT ? ` · ${process.env.NEXT_PUBLIC_COMMIT}` : ''}
        </div>
      </div>
    </div>
  )
}
