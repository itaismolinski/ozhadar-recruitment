import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill in your keys.')
}

export const supabase = createClient(url, key)

// ─── Candidates ────────────────────────────────────────────────────────────

export async function fetchCandidates() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertCandidate(fields) {
  const { data, error } = await supabase
    .from('candidates')
    .insert([fields])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCandidate(id, changes) {
  const { error } = await supabase
    .from('candidates')
    .update(changes)
    .eq('id', id)
  if (error) throw error
}

// ─── File Storage ───────────────────────────────────────────────────────────

const BUCKET = 'candidate-docs'

export async function uploadDoc(candidateId, field, file) {
  const ext  = file.name.split('.').pop()
  const path = `${candidateId}/${field}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export async function getDocUrl(candidateId, field) {
  // List files matching candidateId/field.*
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(candidateId, { search: field })
  if (error || !data?.length) return null

  const path = `${candidateId}/${data[0].name}`
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60) // 1-hour signed URL
  return signed?.signedUrl ?? null
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session))
}
