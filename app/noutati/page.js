import { NOUTATI } from '@/lib/noutati'
import Icon from '@/lib/Icon'

export const metadata = { title: 'Noutăți · Vila Iorga 4' }

export default function Noutati() {
  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 60px', fontFamily: 'var(--font)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', textDecoration: 'none', fontSize: 15 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>‹</span> Înapoi
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t1)', fontSize: 16 }}>
            Vila Iorga 4 <Icon name="picatura" size={18} style={{ color: 'var(--t2)' }} />
          </div>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 400, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 6 }}>Noutăți</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>Ce s-a schimbat în aplicație, la fiecare versiune.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NOUTATI.map((n, i) => (
            <div key={n.versiune} style={{ background: 'var(--card)', borderRadius: 'var(--r)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 999, background: i === 0 ? 'var(--btn)' : 'rgba(255,255,255,0.7)', color: i === 0 ? '#fff' : 'var(--t1)', fontSize: 13 }}>{/^\d/.test(n.versiune) ? 'v' : ''}{n.versiune}</span>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{n.data}</span>
                {i === 0 && <span style={{ fontSize: 12, color: 'var(--t2)' }}>cea mai nouă</span>}
              </div>
              <div style={{ fontSize: 19, color: 'var(--t1)', marginBottom: 10 }}>{n.titlu}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {n.puncte.map((p, j) => (
                  <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.45, color: 'var(--text2)' }}>
                    <Icon name="check" size={16} style={{ color: 'var(--t2)', marginTop: 2 }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
