import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Apelat zilnic de Vercel Cron (vercel.json), ca proiectul Supabase gratuit sa nu fie pus pe pauza
export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data, error } = await supabase.rpc('ping', { p_sursa: 'vercel-cron' })
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })
  return Response.json({ ok: true, ultima: data })
}
