'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
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
  const icon = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#1d1c1b', flexShrink: 0 }
  const input = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: '#1d1c1b', padding: '10px 0', minWidth: 0 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* decor: soare portocaliu si sfera */}
      <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', right: '-120px', top: '8%', background: 'radial-gradient(circle at 35% 35%, #ffb066 0%, #ff7a1a 55%, rgba(255,122,26,0) 72%)', filter: 'blur(8px)', opacity: 0.85 }} />
      <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', left: '-80px', bottom: '6%', background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f1e8e0 45%, #e2d3c5 75%, #ff9a4d 100%)', boxShadow: '0 30px 60px rgba(120,80,40,0.18)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 36, padding: '34px 30px 28px', background: 'rgba(245,238,231,0.62)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.75)', boxShadow: '0 30px 80px rgba(110,80,50,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 44 }}>
          <div style={{ fontSize: 18, color: '#6f6862', fontWeight: 500 }}>Vila Iorga 4</div>
          <div style={{ fontSize: 18, color: '#1d1c1b', fontWeight: 500 }}>Apă 💧</div>
        </div>

        <div style={{ fontSize: 40, fontWeight: 500, color: '#1d1c1b', letterSpacing: '-0.02em', marginBottom: 26 }}>Intră în cont</div>

        <form onSubmit={handleLogin}>
          <div style={pill}>
            <div style={icon}>@</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adresa de email" required autoComplete="email" style={input} />
          </div>
          <div style={pill}>
            <div style={icon}>🔑</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="parola" required autoComplete="current-password" style={input} />
          </div>

          {error && <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 16, color: '#b4410b', fontSize: 14, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22 }}>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#6f6862', maxWidth: 230 }}>
              Citiri apometre, facturi și plăți pentru vecinii din Str. Nicolae Iorga nr. 4. Ai uitat parola? Scrie-i administratorului.
            </div>
            <button type="submit" disabled={loading} aria-label="Intră" style={{ display: 'flex', alignItems: 'center', gap: 0, border: 'none', background: 'transparent', cursor: loading ? 'wait' : 'pointer', padding: 0 }}>
              <span style={{ height: 52, padding: '0 20px', display: 'flex', alignItems: 'center', borderRadius: 999, background: '#1d1c1b', color: '#fff', fontSize: 15, fontWeight: 600 }}>{loading ? 'Se conectează…' : 'Intră'}</span>
              <span style={{ width: 52, height: 52, marginLeft: -10, borderRadius: '50%', background: '#1d1c1b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 0 3px rgba(245,238,231,0.9)' }}>›</span>
            </button>
          </div>
        </form>

        <div style={{ marginTop: 34, textAlign: 'center', fontSize: 11, color: '#9a928b' }}>
          Versiunea {process.env.NEXT_PUBLIC_APP_VERSION} din {process.env.NEXT_PUBLIC_BUILD_DATE}{process.env.NEXT_PUBLIC_COMMIT ? ` · ${process.env.NEXT_PUBLIC_COMMIT}` : ''}
        </div>
      </div>
    </div>
  )
}
