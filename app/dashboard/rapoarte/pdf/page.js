'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CULORI_AP, fmt } from '@/lib/verificari'

const LUNI = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']
const INK = '#1f2a33', GREY = '#6b7780', T1 = '#0f8b8d', LINE = '#d5dde2'

export default function Pagina() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Nunito,sans-serif' }}>Se incarca...</div>}>
      <RaportPdf />
    </Suspense>
  )
}

function RaportPdf() {
  const params = useSearchParams()
  const lunaId = params.get('luna')
  const [date, setDate] = useState(null)
  const [eroare, setEroare] = useState('')

  useEffect(() => { incarca() }, [lunaId])

  async function incarca() {
    const supabase = createClient()
    const { data: toate } = await supabase.from('luni_facturare').select('*').order('an').order('luna')
    if (!toate || toate.length === 0) { setEroare('Nu exista luni.'); return }
    const luna = toate.find(l => String(l.id) === String(lunaId)) || toate[toate.length - 1]
    const idx = toate.findIndex(l => l.id === luna.id)
    const ultimele = toate.slice(Math.max(0, idx - 11), idx + 1)
    const [{ data: calc }, { data: cit }, { data: ist }, { data: pl }] = await Promise.all([
      supabase.from('calcule_lunare').select('*, apartamente(numar, proprietar_nume)').eq('luna_id', luna.id),
      supabase.from('citiri').select('*').eq('luna_id', luna.id),
      supabase.from('calcule_lunare').select('luna_id, consum_individual, apartamente(numar)').in('luna_id', ultimele.map(l => l.id)),
      supabase.from('plati').select('apartament_id, sold_anterior, note').eq('luna_id', luna.id),
    ])
    const randuri = (calc || []).map(c => {
      const ci = (cit || []).find(x => x.apartament_id === c.apartament_id) || {}
      const p = (pl || []).find(x => x.apartament_id === c.apartament_id) || {}
      return {
        numar: c.apartamente?.numar, nume: c.apartamente?.proprietar_nume,
        iv: ci.index_vechi, inn: ci.index_nou,
        consum: Number(c.consum_individual) || 0,
        mc: Number(c.mc_de_plata) || 0,
        suma: Number(c.suma_calculata) || 0,
        sold: Number(p.sold_anterior) || 0,
      }
    }).sort((a, b) => a.numar - b.numar)
    setDate({ luna, randuri, ultimele, ist: ist || [] })
  }

  if (eroare) return <div style={{ padding: 40 }}>{eroare}</div>
  if (!date) return <div style={{ padding: 40, fontFamily: 'Nunito,sans-serif' }}>Se incarca...</div>

  const { luna, randuri, ultimele, ist } = date
  const val = Number(luna.valoare_factura) || 0
  const mc = Number(luna.consum_facturat) || 0
  const sumaAp = randuri.reduce((s, r) => s + r.consum, 0)
  const totalSuma = randuri.reduce((s, r) => s + r.suma, 0)
  const areSold = randuri.some(r => Math.abs(r.sold) > 0.004)
  const totalFinal = randuri.reduce((s, r) => s + r.suma + r.sold, 0)
  const dif = mc - sumaAp
  const numeLuna = `${LUNI[luna.luna - 1]} ${luna.an}`
  const dataF = luna.data_factura ? luna.data_factura.split('-').reverse().join('.') : null
  const apartamente = [...new Set(ist.map(x => x.apartamente?.numar).filter(Boolean))].sort()

  return (
    <div className="pagina">
      <style>{`
        @page { size: A4; margin: 0; }
        body { background: #e9edf0; }
        .pagina { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; font-family: 'Nunito', sans-serif; color: ${INK}; box-shadow: 0 4px 24px rgba(0,0,0,.12); position: relative; }
        .bara { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #1f2a33; }
        .bara button, .bara a { padding: 8px 16px; border-radius: 8px; border: 0; font-weight: 800; font-size: 13px; cursor: pointer; text-decoration: none; font-family: inherit; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: right; color: ${GREY}; font-size: 10px; font-weight: 800; padding: 6px 4px; background: #f4f6f8; }
        td { text-align: right; padding: 8px 4px; border-bottom: .5px solid ${LINE}; }
        th:nth-child(-n+2), td:nth-child(-n+2) { text-align: left; }
        @media print {
          body { background: #fff; }
          .bara { display: none; }
          .pagina { margin: 0; box-shadow: none; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="bara">
        <button onClick={() => window.print()} style={{ background: T1, color: '#fff' }}>⬇ Salveaza ca PDF / Printeaza</button>
        <a href="/dashboard/rapoarte" style={{ background: '#fff', color: INK }}>← Inapoi</a>
      </div>

      <div style={{ background: T1, color: '#fff', padding: '26px 14mm 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 24, fontWeight: 700 }}>Vila Iorga 4 · Apă rece</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Consum {numeLuna} · citiri apometre din 24 {LUNI[luna.luna - 1]}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.5 }}>Str. Nicolae Iorga nr. 4, Brașov<br />Administrator: Vlad Ștefan</div>
      </div>

      <div style={{ padding: '18px 14mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            ['Factura Compania Apa', `${fmt(val)} lei`, `${luna.nr_factura ? 'nr. ' + luna.nr_factura : 'nr. -'} · ${dataF || '-'}${luna.valoare_estimata ? ' · ESTIMAT' : ''}`, '#e3f4f4'],
            ['Consum facturat', `${fmt(mc, mc % 1 ? 2 : 0)} mc`, luna.index_general_nou != null ? `contor general ${fmt(luna.index_general_vechi, 0)} → ${fmt(luna.index_general_nou, 0)}` : 'contor general', '#e3f4f4'],
            ['Preț mediu', `${mc ? fmt(val / mc) : '-'} lei/mc`, 'apă + canal, cu TVA', '#efeaf8'],
          ].map(([t, v, sub, bg]) => (
            <div key={t} style={{ background: bg, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10.5, color: GREY }}>{t}</div>
              <div style={{ fontSize: 20, fontWeight: 800, margin: '2px 0' }}>{v}</div>
              <div style={{ fontSize: 10, color: GREY }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, margin: '20px 0 8px' }}>De plată pe apartament</div>
        <table>
          <thead><tr>
            <th>Ap.</th><th>Proprietar</th><th>Index vechi</th><th>Index nou</th><th>Consum</th><th>Ajustare*</th><th>mc de plată</th><th>{areSold ? 'Luna aceasta' : 'De plată'}</th>
            {areSold && <><th>Avans (−) / Restanță (+)</th><th>Total de plată</th></>}
          </tr></thead>
          <tbody>
            {randuri.map(r => {
              const adj = r.mc - r.consum
              return (
                <tr key={r.numar}>
                  <td style={{ fontWeight: 800 }}>{r.numar}</td>
                  <td><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: CULORI_AP[r.numar], marginRight: 7, verticalAlign: 'middle' }} />{r.nume}</td>
                  <td>{fmt(r.iv)}</td><td>{fmt(r.inn)}</td><td>{fmt(r.consum)}</td>
                  <td>{(adj >= 0 ? '+' : '−') + fmt(Math.abs(adj))}</td>
                  <td>{fmt(r.mc)}</td>
                  <td style={areSold ? {} : { fontWeight: 800, color: T1, fontSize: 12.5 }}>{fmt(r.suma)}{areSold ? '' : ' lei'}</td>
                  {areSold && <>
                    <td>{Math.abs(r.sold) > 0.004 ? (r.sold > 0 ? '+' : '−') + fmt(Math.abs(r.sold)) : '-'}</td>
                    <td style={{ fontWeight: 800, color: T1, fontSize: 12.5 }}>{fmt(Math.max(0, r.suma + r.sold))} lei</td>
                  </>}
                </tr>
              )
            })}
            <tr>
              <td></td><td style={{ fontWeight: 800 }}>Total</td><td></td><td></td>
              <td>{fmt(sumaAp)}</td><td></td><td>{fmt(randuri.reduce((s, r) => s + r.mc, 0))}</td>
              <td style={{ fontWeight: 800, fontSize: areSold ? 11.5 : 12.5 }}>{fmt(totalSuma)} lei</td>
              {areSold && <><td></td><td style={{ fontWeight: 800, fontSize: 12.5 }}>{fmt(totalFinal)} lei</td></>}
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            ['Suma apometrelor individuale', `${fmt(sumaAp)} mc`, 'Ap. 1 + 2 + 3 + 4 + 5'],
            ['Contor general (facturat)', `${fmt(mc)} mc`, luna.index_general_nou != null ? `${fmt(luna.index_general_vechi, 0)} → ${fmt(luna.index_general_nou, 0)}` : 'pe factura Compania Apa'],
            ['Diferență', `${(dif >= 0 ? '+' : '−') + fmt(Math.abs(dif))} mc`, dif > 0.005 ? 'contorul general arată mai mult' : dif < -0.005 ? 'apometrele arată mai mult' : 'se potrivesc exact'],
          ].map(([t, v, sub], i) => (
            <div key={t} style={{ border: `1.5px solid ${i === 2 && Math.abs(dif) > Math.max(2, mc * 0.1) ? '#e08a3c' : LINE}`, borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 10.5, color: GREY }}>{t}</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 9.5, color: GREY }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#efeaf8', borderRadius: 8, padding: '10px 12px', marginTop: 10, fontSize: 11, lineHeight: 1.5 }}>
          <strong>* Ajustare:</strong> {luna.mod_repartizare === 'special'
            ? <>diferența de {(dif >= 0 ? '+' : '−') + fmt(Math.abs(dif))} mc a fost atribuită integral unui singur apartament (decizie pentru luna aceasta). Total de plată = exact valoarea facturii.</>
            : luna.mod_repartizare === 'egal'
              ? <>diferența de {(dif >= 0 ? '+' : '−') + fmt(Math.abs(dif))} mc se împarte egal la toate apartamentele. Total de plată = exact valoarea facturii.</>
              : <>diferența de {(dif >= 0 ? '+' : '−') + fmt(Math.abs(dif))} mc se împarte proporțional cu consumul fiecăruia (cine consumă mai mult preia o parte mai mare). Apartamentele fără consum nu plătesc diferențe. Total de plată = exact valoarea facturii.</>}
          {Math.abs(dif) > Math.max(2, mc * 0.1) && <><br /><strong style={{ color: '#a85a12' }}>Diferență mare luna aceasta: verific citirile și apometrele.</strong></>}
        </div>

        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, margin: '20px 0 6px' }}>Consum pe ultimele 12 luni (mc)</div>
        <Grafic ultimele={ultimele} ist={ist} apartamente={apartamente} />

        <div style={{ marginTop: 16, fontSize: 11.5, lineHeight: 1.6 }}>
          <strong>Plata</strong><br />
          {luna.an * 12 + luna.luna <= 2026 * 12 + 9 ? <>
            Factura pe {LUNI[luna.luna - 1]} a fost achitată deja de Corina, deci suma pentru luna aceasta se dă <strong>Corinei</strong>, ca până acum.<br />
            De la consumul din octombrie, plata se face prin transfer către Ștefan Vlad (RON): ING <strong>RO92 INGB 0000 9999 0052 0242</strong> · Revolut <strong>RO45 REVO 0000 1364 3298 8060</strong>.<br />
          </> : <>
            Prin transfer către Ștefan Vlad (RON), cu mențiunea „Apă {LUNI[luna.luna - 1]} Ap. X”:<br />
            ING: <strong>RO92 INGB 0000 9999 0052 0242</strong> &nbsp;·&nbsp; Revolut: <strong>RO45 REVO 0000 1364 3298 8060</strong><br />
          </>}
          Vă rog să trimiteți pe grup o confirmare după plată.<br />
          Citirile pentru luna următoare: pe 24, cu poză clară la apometru (cifrele negre și roșii), chiar dacă nu ați consumat.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 10, left: '14mm', right: '14mm', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: GREY }}>
        <span>Istoricul complet (citiri, facturi, grafice): iorga4.vercel.app</span>
        <span>Calcul generat automat din citirile apometrelor</span>
      </div>
    </div>
  )
}

function Grafic({ ultimele, ist, apartamente }) {
  const W = 680, H = 210, pl = 30, pb = 26, pt = 26
  const n = ultimele.length
  const val = (lid, ap) => {
    const x = ist.find(i => i.luna_id === lid && i.apartamente?.numar === ap)
    return x ? Math.max(0, Number(x.consum_individual) || 0) : 0
  }
  const max = Math.max(1, ...ultimele.map(l => Number(l.consum_facturat) || 0), ...ultimele.flatMap(l => apartamente.map(a => val(l.id, a))))
  const pas = max > 20 ? 5 : 2
  const top = Math.ceil(max / pas) * pas
  const gw = (W - pl - 6) / n
  const bw = Math.min(9, (gw - 8) / Math.max(1, apartamente.length))
  const y = v => pt + (H - pt - pb) * (1 - v / top)
  const linie = ultimele.map((l, i) => `${pl + gw * i + gw / 2},${y(Number(l.consum_facturat) || 0)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} fontFamily="Nunito,sans-serif">
      {Array.from({ length: top / pas + 1 }, (_, k) => k * pas).map(v => (
        <g key={v}>
          <line x1={pl} x2={W - 4} y1={y(v)} y2={y(v)} stroke="#eef1f3" />
          <text x={pl - 5} y={y(v) + 3} fontSize="8" textAnchor="end" fill={GREY}>{v}</text>
        </g>
      ))}
      {ultimele.map((l, i) => (
        <g key={l.id}>
          {apartamente.map((a, k) => {
            const v = val(l.id, a)
            const x = pl + gw * i + gw / 2 - (apartamente.length * bw) / 2 + k * bw
            return <rect key={a} x={x} y={y(v)} width={bw - 1} height={Math.max(0, H - pb - y(v))} fill={CULORI_AP[a]} />
          })}
          <text x={pl + gw * i + gw / 2} y={H - pb + 13} fontSize="8" textAnchor="middle" fill={GREY}>{LUNI[l.luna - 1].slice(0, 3)} {String(l.an).slice(2)}</text>
        </g>
      ))}
      <polyline points={linie} fill="none" stroke={INK} strokeWidth="1.3" />
      {ultimele.map((l, i) => <circle key={l.id} cx={pl + gw * i + gw / 2} cy={y(Number(l.consum_facturat) || 0)} r="2" fill={INK} />)}
      <g fontSize="8.5" fill={INK}>
        {apartamente.map((a, k) => (
          <g key={a} transform={`translate(${pl + k * 58},8)`}>
            <rect width="9" height="9" rx="2" fill={CULORI_AP[a]} /><text x="13" y="8">Ap.{a}</text>
          </g>
        ))}
        <g transform={`translate(${pl + apartamente.length * 58},8)`}>
          <line x1="0" x2="14" y1="4.5" y2="4.5" stroke={INK} strokeWidth="1.3" /><text x="18" y="8">Contor general (facturat)</text>
        </g>
      </g>
    </svg>
  )
}
