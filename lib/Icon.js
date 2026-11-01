// Iconite din linii subtiri, in stilul grafic al aplicatiei (culoarea vine din `color` al parintelui)
const P = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="2.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="3.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="3.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="2.2" /></>,
  citiri: <><circle cx="12" cy="13" r="7.5" /><path d="M12 13l3.2-3.2" /><path d="M8 15.5h0.01M16 15.5h0.01M9 9.5h0.01" /><path d="M10 3.5h4" /></>,
  facturi: <><path d="M6.5 3.5h8l3.5 3.5v13.5h-11.5z" /><path d="M14.5 3.5v3.5h3.5" /><path d="M9.5 12h5M9.5 15.5h5" /></>,
  plati: <><rect x="3" y="6" width="18" height="12.5" rx="3" /><path d="M3 10h18" /><path d="M7 14.5h3" /></>,
  rapoarte: <><path d="M8.5 4.5h-1.5a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12.5a2 2 0 0 0-2-2h-1.5" /><rect x="8.5" y="3" width="7" height="3.2" rx="1.6" /><path d="M9 11.5h6M9 15h4" /></>,
  grafice: <><path d="M3.5 19.5h17" /><path d="M5 15.5l4.5-4.5 3.5 3 6-6.5" /><path d="M15.5 7.5h3.5v3.5" /></>,
  setari: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="17" r="2.2" /></>,
  picatura: <><path d="M12 3.2c0 0-6.5 7.2-6.5 11.3a6.5 6.5 0 0 0 13 0c0-4.1-6.5-11.3-6.5-11.3z" /><path d="M9 15.2a3 3 0 0 0 2.5 2.6" /></>,
  lacat: <><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8 10.5v-3a4 4 0 0 1 8 0v3" /></>,
  deschis: <><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8 10.5v-3a4 4 0 0 1 7.6-1.7" /></>,
  folder: <><path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></>,
  creion: <><path d="M15.5 4.5l4 4-10.5 10.5h-4v-4z" /><path d="M13.5 6.5l4 4" /></>,
  poza: <><path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  check: <><path d="M5 12.5l4.5 4.5 9.5-10" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  cheie: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8.5-8.5M16.5 6.5l2.5 2.5M14.5 8.5l1.5 1.5" /></>,
  arond: <><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0-3.5 7.1" /></>,
  alerta: <><path d="M12 4l9 15.5h-18z" /><path d="M12 10v4.5M12 17.2h0.01" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 8h0.01" /></>,
  cauta: <><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5l4 4" /></>,
  ok: <><circle cx="12" cy="12" r="8.5" /><path d="M8 12.3l2.8 2.8 5.2-5.6" /></>,
}

export default function Icon({ name, size = 20, stroke = 1.6, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', flexShrink: 0, ...style }}>
      {P[name]}
    </svg>
  )
}
