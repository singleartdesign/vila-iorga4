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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #5b21b6 0%, #1565c0 50%, #0ea5e9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '48px 40px',
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>💧</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>Vila Iorga 4</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Administrare consum apă</div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#1e293b' }}>
          Bine ai revenit
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
          Introdu datele de autentificare
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplu.ro" required
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              Parolă
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fee2e2', borderRadius: 8,
              color: '#b91c1c', fontSize: 13, marginBottom: 16
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13,
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            border: 'none', borderRadius: 12, color: 'white',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Se conectează...' : 'Intră în aplicație →'}
          </button>
        </form>
      </div>
    </div>
  )
}
