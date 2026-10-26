import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const maxDuration = 60

const fara = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[șş]/g, 's').replace(/[țţ]/g, 't').replace(/[ȘŞ]/g, 'S').replace(/[ȚŢ]/g, 'T')

export async function POST(request) {
  const url = process.env.DRIVE_SCRIPT_URL, secret = process.env.DRIVE_SCRIPT_SECRET
  if (!url || !secret) return Response.json({ ok: false, error: 'Salvarea in Drive nu e configurata' }, { status: 501 })

  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ ok: false, error: 'neautentificat' }, { status: 401 })

  const { luna_id, apartament_id } = await request.json()
  const { data: c } = await supabase.from('citiri')
    .select('poza_path, introdus_la, apartamente(numar, proprietar_nume), luni_facturare(an, luna, drive_folder_id)')
    .eq('luna_id', luna_id).eq('apartament_id', apartament_id).single()
  if (!c?.poza_path) return Response.json({ ok: false, error: 'citire fara poza' }, { status: 404 })

  const { data: blob, error } = await supabase.storage.from('citiri-poze').download(c.poza_path)
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })

  // folderul din Drive poarta luna facturii = luna consumului + 1
  let an = c.luni_facturare.an, luna = c.luni_facturare.luna + 1
  if (luna > 12) { luna = 1; an++ }
  const folder = `${String(luna).padStart(2, '0')}.${an}`
  const data = new Date(c.introdus_la || Date.now()).toISOString().slice(0, 10)
  const ext = (c.poza_path.split('.').pop() || 'jpg').toLowerCase()
  const nume = `Citire Ap${c.apartamente.numar} ${fara(c.apartamente.proprietar_nume.split(' ')[0])} (${data}).${ext}`

  const buf = Buffer.from(await blob.arrayBuffer())
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret, an_folder: an, folder, nume, mimeType: blob.type || 'image/jpeg', data: buf.toString('base64') }),
    redirect: 'follow',
  })
  let rez
  try { rez = await r.json() } catch { rez = { ok: false, error: 'raspuns invalid de la Google' } }

  if (rez.ok && rez.folderId && !c.luni_facturare.drive_folder_id) {
    await supabase.from('luni_facturare').update({ drive_folder_id: rez.folderId }).eq('id', luna_id) // reuseste doar pentru admin
  }
  return Response.json(rez, { status: rez.ok ? 200 : 502 })
}
