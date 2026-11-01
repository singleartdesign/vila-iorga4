// Fundal decorativ: apa, picaturi si sfere de sticla in nuante de turcoaz pana la bleumarin
export default function FundalApa() {
  return (
    <div className="fundal-apa" aria-hidden="true">
      <svg viewBox="0 0 1200 1600" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <defs>
          <linearGradient id="fa-cer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef6f7" />
            <stop offset="0.55" stopColor="#dcebef" />
            <stop offset="1" stopColor="#c7dde6" />
          </linearGradient>
          <radialGradient id="fa-sfera-turcoaz" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#d9f4f4" />
            <stop offset="0.75" stopColor="#5cc8cf" />
            <stop offset="1" stopColor="#1a8fa3" />
          </radialGradient>
          <radialGradient id="fa-sfera-bleumarin" cx="0.32" cy="0.28" r="0.8">
            <stop offset="0" stopColor="#cfe3f3" />
            <stop offset="0.3" stopColor="#5d8fc0" />
            <stop offset="0.75" stopColor="#173f6e" />
            <stop offset="1" stopColor="#0b2545" />
          </radialGradient>
          <radialGradient id="fa-sfera-perla" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#eef4f6" />
            <stop offset="0.85" stopColor="#bcd8e0" />
            <stop offset="1" stopColor="#38b2c2" />
          </radialGradient>
          <radialGradient id="fa-bula" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.93" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="fa-val1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fd6db" stopOpacity="0.75" />
            <stop offset="1" stopColor="#2a9db0" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fa-val2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f8fb0" stopOpacity="0.8" />
            <stop offset="1" stopColor="#174a7c" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="fa-val3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14406e" />
            <stop offset="1" stopColor="#0b2545" />
          </linearGradient>
          <linearGradient id="fa-picatura" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#8fdde0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1a6f9a" stopOpacity="0.85" />
          </linearGradient>
          <filter id="fa-textura" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.55" />
          </filter>
          <filter id="fa-moale"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>

        <rect width="1200" height="1600" fill="url(#fa-cer)" />
        {/* lumina turcoaz difuza */}
        <circle cx="980" cy="260" r="320" fill="#5cc8cf" opacity="0.28" filter="url(#fa-moale)" />
        <circle cx="140" cy="900" r="260" fill="#3d7fd1" opacity="0.14" filter="url(#fa-moale)" />

        {/* bula mare de sticla (ca domul din exemplu) */}
        <g className="fa-plutire-lenta">
          <circle cx="620" cy="560" r="330" fill="url(#fa-bula)" />
          <circle cx="620" cy="560" r="330" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
          <path d="M430 340 Q 520 260 650 250" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="14" strokeLinecap="round" />
          <path d="M760 280 Q 860 320 905 420" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="8" strokeLinecap="round" />
        </g>

        {/* picatura de apa */}
        <g className="fa-plutire">
          <path d="M1010 640 C 1010 640 930 760 930 815 A 80 80 0 0 0 1090 815 C 1090 760 1010 640 1010 640 Z" fill="url(#fa-picatura)" />
          <path d="M975 790 Q 970 830 995 855" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
        </g>

        {/* sfere */}
        <g className="fa-plutire-lenta"><circle cx="170" cy="1180" r="210" fill="url(#fa-sfera-perla)" /></g>
        <g className="fa-plutire"><circle cx="930" cy="1260" r="125" fill="url(#fa-sfera-bleumarin)" /></g>
        <g className="fa-plutire-lenta"><circle cx="1090" cy="1060" r="58" fill="url(#fa-sfera-turcoaz)" /></g>
        <g className="fa-plutire"><circle cx="90" cy="420" r="70" fill="url(#fa-sfera-turcoaz)" /></g>

        {/* valuri */}
        <g className="fa-val-a">
          <path d="M-200 1330 C 0 1270 200 1390 400 1330 S 800 1270 1000 1330 S 1400 1390 1600 1330 L 1600 1700 L -200 1700 Z" fill="url(#fa-val1)" />
        </g>
        <g className="fa-val-b">
          <path d="M-200 1410 C 0 1360 200 1460 400 1410 S 800 1360 1000 1410 S 1400 1460 1600 1410 L 1600 1700 L -200 1700 Z" fill="url(#fa-val2)" />
        </g>
        <g className="fa-val-a">
          <path d="M-200 1490 C 0 1450 200 1530 400 1490 S 800 1450 1000 1490 S 1400 1530 1600 1490 L 1600 1700 L -200 1700 Z" fill="url(#fa-val3)" />
        </g>

        {/* textura de apa (reflexii) */}
        <rect width="1200" height="1600" filter="url(#fa-textura)" opacity="0.22" />

        {/* bule mici care urca */}
        {[[300, 1500, 9, 0], [520, 1540, 6, 3], [760, 1520, 11, 6], [860, 1560, 5, 9], [1100, 1530, 8, 12], [200, 1560, 6, 15]].map(([x, y, r, d], i) => (
          <circle key={i} className="fa-bulita" style={{ animationDelay: `${d}s` }} cx={x} cy={y} r={r} fill="#ffffff" fillOpacity="0.35" stroke="#ffffff" strokeOpacity="0.8" />
        ))}
      </svg>
    </div>
  )
}
