import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(url, key)

// ─── Security Helpers ────────────────────────────────────────────────────────

// Sanitize text input — strip HTML tags, trim whitespace
export function sanitize(val) {
  if (typeof val !== 'string') return val
  return val.replace(/<[^>]*>/g, '').trim().slice(0, 2000)
}

// Sanitize an object's string fields before DB insert/update
export function sanitizeRecord(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? sanitize(v) : v
  }
  return out
}

// Get current user's role from JWT metadata
export async function getMyRole() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.user_metadata?.role || 'staff'
}

// Check if current user is admin
export async function isAdmin() {
  return (await getMyRole()) === 'admin'
}


// ─── Candidates ────────────────────────────────────────────────────────────
export async function fetchCandidates() {
  const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false })
  if (error) throw error; return data
}
export async function insertCandidate(fields) {
  const { data, error } = await supabase.from('candidates').insert([sanitizeRecord(fields)]).select().single()
  if (error) throw error; return data
}
export async function updateCandidate(id, changes) {
  const { error } = await supabase.from('candidates').update(changes).eq('id', id)
  if (error) throw error
}
export async function deleteCandidate(id) {
  const { error } = await supabase.from('candidates').delete().eq('id', id)
  if (error) throw error
}

// ─── Candidate Notes ────────────────────────────────────────────────────────
export async function fetchNotes(candidateId) {
  const { data, error } = await supabase.from('candidate_notes').select('*').eq('candidate_id', candidateId).order('note_date', { ascending: false })
  if (error) throw error; return data
}
export async function insertNote(fields) {
  const { data, error } = await supabase.from('candidate_notes').insert([fields]).select().single()
  if (error) throw error; return data
}
export async function deleteNote(id) {
  const { error } = await supabase.from('candidate_notes').delete().eq('id', id)
  if (error) throw error
}

// ─── Tasks ──────────────────────────────────────────────────────────────────
export async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
  if (error) throw error; return data
}
export async function insertTask(fields) {
  const { data, error } = await supabase.from('tasks').insert([fields]).select().single()
  if (error) throw error; return data
}
export async function updateTask(id, changes) {
  const { error } = await supabase.from('tasks').update(changes).eq('id', id)
  if (error) throw error
}
export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ─── Employers ──────────────────────────────────────────────────────────────
export async function fetchEmployers() {
  const { data, error } = await supabase.from('employers').select('*').order('created_at', { ascending: false })
  if (error) throw error; return data
}
export async function insertEmployer(fields) {
  const { data, error } = await supabase.from('employers').insert([sanitizeRecord(fields)]).select().single()
  if (error) throw error; return data
}
export async function updateEmployer(id, changes) {
  const { error } = await supabase.from('employers').update(changes).eq('id', id)
  if (error) throw error
}
export async function deleteEmployer(id) {
  const { error } = await supabase.from('employers').delete().eq('id', id)
  if (error) throw error
}

// ─── Employer Notes ─────────────────────────────────────────────────────────
export async function fetchEmployerNotes(employerId) {
  const { data, error } = await supabase.from('employer_notes').select('*').eq('employer_id', employerId).order('note_date', { ascending: false })
  if (error) throw error; return data
}
export async function insertEmployerNote(fields) {
  const { data, error } = await supabase.from('employer_notes').insert([fields]).select().single()
  if (error) throw error; return data
}
export async function deleteEmployerNote(id) {
  const { error } = await supabase.from('employer_notes').delete().eq('id', id)
  if (error) throw error
}

// ─── Employer History ───────────────────────────────────────────────────────
export async function fetchEmployerHistory(employerId) {
  const { data, error } = await supabase.from('employer_history').select('*').eq('employer_id', employerId).order('created_at', { ascending: false })
  if (error) throw error; return data
}
export async function logEmployerEvent(employerId, action, details) {
  await supabase.from('employer_history').insert([{ employer_id: employerId, action, details }])
}

// ─── Storage ────────────────────────────────────────────────────────────────
const CAND_BUCKET = 'candidate-docs'
const EMP_BUCKET  = 'employer-docs'

export async function uploadDoc(candidateId, field, file) {
  const ALLOWED = ['pdf','jpg','jpeg','png','doc','docx']
  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED.includes(ext)) throw new Error(`סוג קובץ לא מורשה: .${ext}`)
  if (file.size > 25 * 1024 * 1024) throw new Error('הקובץ גדול מדי — מקסימום 25MB')
  const path = `${candidateId}/${field}.${ext}`
  const { error } = await supabase.storage.from(CAND_BUCKET).upload(path, file, { upsert: true })
  if (error) throw error; return path
}
export async function getDocUrl(candidateId, field) {
  const { data, error } = await supabase.storage.from(CAND_BUCKET).list(candidateId, { search: field })
  if (error || !data?.length) return null
  const path = `${candidateId}/${data[0].name}`
  const { data: signed } = await supabase.storage.from(CAND_BUCKET).createSignedUrl(path, 3600)
  return signed?.signedUrl ?? null
}
export async function uploadEmployerDoc(employerId, docType, file) {
  const ext  = file.name.split('.').pop()
  const path = `${employerId}/${docType}_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(EMP_BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  await supabase.from('employer_docs').insert([{ employer_id: employerId, doc_type: docType, doc_name: file.name }])
  return path
}
export async function fetchEmployerDocList(employerId) {
  const { data, error } = await supabase.from('employer_docs').select('*').eq('employer_id', employerId).order('uploaded_at', { ascending: false })
  if (error) throw error; return data
}
export async function getEmployerDocUrl(path) {
  const { data } = await supabase.storage.from(EMP_BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error; return data
}
export async function signOut() { await supabase.auth.signOut() }
export async function getSession() {
  const { data } = await supabase.auth.getSession(); return data.session
}
export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_e, s) => cb(s))
}
