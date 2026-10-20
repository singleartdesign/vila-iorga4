// Verificari automate factura vs citiri apometre
export const CULORI_AP = { 1: '#0f8b8d', 2: '#7a5cc4', 3: '#e08a3c', 4: '#9aa5ad', 5: '#3d7fd1' }

export function driveUrl(folderId) {
  return folderId ? `https://drive.google.com/drive/folders/${folderId}` : null
}

export function fmt(x, d = 2) {
  const n = Number(x)
  if (x === null || x === undefined || isNaN(n)) return '-'
  return n.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d })
}

// returneaza lista de probleme pentru o luna: [{nivel:'eroare'|'atentie'|'info', text}]
export function verificaLuna(luna, citiri, nrApartamente = 5) {
  const probleme = []
  if (!luna) return probleme
  const facturat = Number(luna.consum_facturat) || 0
  const valoare = Number(luna.valoare_factura) || 0
  const cit = citiri || []
  const sumaApometre = cit.reduce((s, c) => s + (Number(c.consum) || 0), 0)

  if (!valoare || !facturat) {
    probleme.push({ nivel: 'atentie', text: 'Factura nu e introdusa inca (valoare sau consum lipsa).' })
  }
  if (cit.length < nrApartamente) {
    probleme.push({ nivel: 'eroare', text: `Lipsesc citiri: ${cit.length} din ${nrApartamente} apartamente. Fara toate citirile, diferenta nu poate fi verificata.` })
  }
  cit.forEach(c => {
    if (Number(c.consum) < 0) probleme.push({ nivel: 'eroare', text: `Ap. ${c.apartamente?.numar ?? c.apartament_id}: index nou mai mic decat cel vechi (consum negativ).` })
  })
  if (luna.index_general_vechi != null && luna.index_general_nou != null && facturat) {
    const dg = Number(luna.index_general_nou) - Number(luna.index_general_vechi)
    if (Math.abs(dg - facturat) > 0.5) {
      probleme.push({ nivel: 'atentie', text: `Contor general ${fmt(luna.index_general_vechi, 0)} → ${fmt(luna.index_general_nou, 0)} = ${fmt(dg, 0)} mc, dar pe factura scrie ${fmt(facturat, 0)} mc.` })
    }
  }
  if (luna.valoare_estimata) {
    probleme.push({ nivel: 'info', text: 'Factura e pe consum ESTIMAT de Compania Apa. Se regularizeaza la urmatoarea citire reala.' })
  }
  if (facturat && cit.length >= nrApartamente) {
    const dif = facturat - sumaApometre
    const prag = Math.max(2, facturat * 0.1)
    if (Math.abs(dif) > prag) {
      probleme.push({
        nivel: 'eroare',
        text: dif > 0
          ? `Contorul general arata cu ${fmt(dif)} mc mai mult decat suma apometrelor (${fmt(sumaApometre)} mc). Posibila pierdere, citire gresita sau apometru blocat.`
          : `Suma apometrelor (${fmt(sumaApometre)} mc) depaseste contorul general cu ${fmt(-dif)} mc. Posibila citire gresita sau apometru care inregistreaza in plus (vezi Ap. 3).`
      })
    }
  }
  return probleme
}

export const STIL_NIVEL = {
  eroare: { bg: '#fee2e2', fg: '#b91c1c', bd: '#fecaca', icon: '⚠️' },
  atentie: { bg: '#fff7ed', fg: '#c2410c', bd: '#fed7aa', icon: '🔎' },
  info: { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe', icon: 'ℹ️' },
}

export function AlerteLuna({ probleme }) {
  if (!probleme || probleme.length === 0) {
    return (
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--t7)', color: 'var(--t1)', border: '1px solid var(--t5)', fontSize: 12, fontWeight: 700 }}>
        ✓ Factura si citirile se potrivesc.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {probleme.map((p, i) => {
        const s = STIL_NIVEL[p.nivel]
        return (
          <div key={i} style={{ padding: '10px 14px', borderRadius: 12, background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
            {s.icon} {p.text}
          </div>
        )
      })}
    </div>
  )
}
