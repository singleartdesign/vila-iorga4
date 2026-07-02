'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💧</div>
        <div style={{ color: '#94a3b8' }}>Se incarca...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui' }}>
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>💧</span>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Vila Iorga 4</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Administrare apa</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{profile?.nume}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'capitalize' }}>{profile?.rol}</div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '7px 14px', background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13
          }}>Iesi</button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16,
          borderLeft: '4px solid #14b8a6'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Bine ai revenit, {profile?.nume}!
          </div>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Aplicatia Vila Iorga 4 functioneaza. Urmatorul pas: adaugam toate paginile.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '🔢', label: 'Citiri contoare', color: '#dbeafe' },
            { icon: '💳', label: 'Plati & Solduri', color: '#dcfce7' },
            { icon: '📄', label: 'Facturi lunare', color: '#ede9fe' },
            { icon: '📈', label: 'Grafice', color: '#fef3c7' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'white', borderRadius: 14, padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: item.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, margin: '0 auto 10px'
              }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
