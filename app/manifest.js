export default function manifest() {
  return {
    name: 'Vila Iorga 4 · Apă',
    short_name: 'Iorga 4 Apă',
    description: 'Citiri apometre, facturi și plăți pentru Vila Iorga 4',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#7c3aed',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
