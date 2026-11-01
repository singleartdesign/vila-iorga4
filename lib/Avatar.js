// Avatar rotund: poza utilizatorului daca exista, altfel initialele pe culoarea lui
export default function Avatar({ url, nume = '', size = 36, color = '#3d7fd1', style }) {
  const init = (nume || '?').trim().substring(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: url ? 'rgba(255,255,255,0.6)' : color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: Math.round(size * 0.34),
      boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 4px 12px rgba(11,37,69,0.15)', ...style,
    }}>
      {url ? <img src={url} alt={nume} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : init}
    </div>
  )
}

// Micsoreaza poza in browser (patrat, 512px, JPEG) inainte de incarcare
export async function pregatesteAvatar(file, latura = 512) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = url })
    const s = Math.min(img.naturalWidth, img.naturalHeight)
    const c = document.createElement('canvas'); c.width = latura; c.height = latura
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, latura, latura)
    return await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.85))
  } finally { URL.revokeObjectURL(url) }
}
