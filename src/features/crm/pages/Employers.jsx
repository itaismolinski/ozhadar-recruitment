import { useState, useEffect, useRef } from 'react'
import {
  fetchEmployers, insertEmployer, updateEmployer, deleteEmployer,
  fetchEmployerNotes, insertEmployerNote, deleteEmployerNote,
  fetchEmployerHistory, logEmployerEvent,
  uploadEmployerDoc, fetchEmployerDocList, getEmployerDocUrl,
  fetchCandidates
} from '../../lib/supabase.js'
import { SECTORS } from '../../constants.js'

const SANS    = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"
const TEAL    = '#0F766E'

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'

// ─── SECTOR COLOR MAP ────────────────────────────────────────────────────────
const SECTOR_COLORS = {
  construction: '#0F766E', industry: '#1D4ED8', commerce: '#7C3AED',
  agriculture: '#22C55E',  restaurant: '#D97706', hospitality: '#DC2626',
  other: '#9CA3AF'
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status !== 'inactive'
  return (
    <span style={{ background: active ? '#F0FDF9' : '#F9FAFB', color: active ? TEAL : '#9CA3AF', border: `1.5px solid ${active ? '#CCFBF1' : '#E5E7EB'}`, padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: SANS }}>
      {active ? '● פעיל' : '○ לא פעיל'}
    </span>
  )
}

// ─── CONFIRM DELETE ──────────────────────────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '90%', fontFamily: SANS }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>🗑️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>מחיקת מעסיק</h3>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 22 }}>
          האם למחוק את <strong>{name}</strong>?<br/>
          <span style={{ fontSize: 12, color: '#EF4444' }}>כל הנתונים יימחקו לצמיתות</span>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 11, background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>ביטול</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 11, background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>מחק</button>
        </div>
      </div>
    </div>
  )
}

// ─── EMPLOYER FORM (new / edit) ───────────────────────────────────────────────
const EMPTY_EMP = { name:'', company_id:'', sector:'', address:'', city:'', phone:'', email:'', website:'', contact_name:'', contact_role:'', contact_phone:'', contact_email:'', workers_quota:'', status:'active', notes:'' }

function EmployerForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState(existing ? { ...existing } : { ...EMPTY_EMP })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { alert('שם עסק הוא שדה חובה'); return }
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  const INP = { width: '100%', padding: '10px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#111827', fontFamily: SANS, fontSize: 13, outline: 'none' }
  const lbl = (text) => <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: SANS }}>{text}</label>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 620, fontFamily: SANS }}>
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY }}>{existing ? 'עריכת מעסיק' : 'מעסיק חדש'}</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Business details */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, fontFamily: DISPLAY }}>פרטי העסק</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                {lbl('שם העסק *')}
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם העסק" style={INP} />
              </div>
              <div>
                {lbl('ח.פ / ע.מ')}
                <input value={form.company_id || ''} onChange={e => set('company_id', e.target.value)} placeholder="000000000" style={INP} />
              </div>
              <div>
                {lbl('ענף')}
                <select value={form.sector || ''} onChange={e => set('sector', e.target.value)} style={{ ...INP, cursor: 'pointer', appearance: 'none' }}>
                  <option value=''>— בחר ענף —</option>
                  {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he} / {s.en}</option>)}
                </select>
              </div>
              <div>
                {lbl('טלפון')}
                <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" style={INP} type="tel" />
              </div>
              <div>
                {lbl('אימייל')}
                <input value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@company.com" style={INP} type="email" />
              </div>
              <div>
                {lbl('כתובת')}
                <input value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="רחוב + מספר" style={INP} />
              </div>
              <div>
                {lbl('עיר')}
                <input value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="תל אביב" style={INP} />
              </div>
              <div>
                {lbl('אתר אינטרנט')}
                <input value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="www.company.com" style={INP} />
              </div>
              <div>
                {lbl('מכסת עובדים')}
                <input value={form.workers_quota || ''} onChange={e => set('workers_quota', e.target.value)} placeholder="מס׳ עובדים מורשה" style={INP} type="number" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, fontFamily: DISPLAY }}>איש קשר</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                {lbl('שם איש קשר')}
                <input value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} style={INP} />
              </div>
              <div>
                {lbl('תפקיד')}
                <input value={form.contact_role || ''} onChange={e => set('contact_role', e.target.value)} placeholder="מנהל HR, מנכ״ל..." style={INP} />
              </div>
              <div>
                {lbl('טלפון ישיר')}
                <input value={form.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} style={INP} type="tel" />
              </div>
              <div>
                {lbl('אימייל ישיר')}
                <input value={form.contact_email || ''} onChange={e => set('contact_email', e.target.value)} style={INP} type="email" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            {lbl('סטטוס')}
            <div style={{ display: 'flex', gap: 10 }}>
              {[['active','פעיל'],['inactive','לא פעיל']].map(([v, l]) => (
                <button key={v} onClick={() => set('status', v)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${form.status === v ? TEAL : '#E5E7EB'}`, background: form.status === v ? '#F0FDF9' : '#F9FAFB', color: form.status === v ? TEAL : '#9CA3AF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1.5px solid #F3F4F6', display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>ביטול</button>
          <button onClick={save} disabled={saving}
            style={{ flex: 2, padding: 12, background: saving ? '#6EE7B7' : TEAL, color: 'white', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: SANS }}>
            {saving ? 'שומר...' : existing ? '💾 שמור שינויים' : '+ הוסף מעסיק'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EMPLOYER CARD (full page with tabs) ─────────────────────────────────────
function EmployerCard({ employer, candidates, onUpdate, onDelete, onBack }) {
  const [tab, setTab]         = useState('info')
  const [form, setForm]       = useState({ ...employer })
  const [notes, setNotes]     = useState([])
  const [history, setHistory] = useState([])
  const [docs, setDocs]       = useState([])
  const [noteText, setNoteText] = useState('')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving]   = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef = useRef()

  const myWorkers = candidates.filter(c => c.placement === employer.name)
  const color = SECTOR_COLORS[employer.sector] || '#9CA3AF'

  useEffect(() => {
    fetchEmployerNotes(employer.id).then(setNotes).catch(() => {})
    fetchEmployerHistory(employer.id).then(setHistory).catch(() => {})
    fetchEmployerDocList(employer.id).then(setDocs).catch(() => {})
  }, [employer.id])

  const saveInfo = async () => {
    setSaving(true)
    await onUpdate(employer.id, form)
    await logEmployerEvent(employer.id, 'פרטים עודכנו', null)
    setSaving(false)
    setEditMode(false)
    const h = await fetchEmployerHistory(employer.id); setHistory(h)
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    const n = await insertEmployerNote({ employer_id: employer.id, note_date: noteDate, text: noteText.trim() })
    setNotes(prev => [n, ...prev])
    setNoteText('')
    setNoteDate(new Date().toISOString().split('T')[0])
  }

  const removeNote = async (id) => {
    await deleteEmployerNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const handleUpload = async (docType, file) => {
    try {
      await uploadEmployerDoc(employer.id, docType, file)
      await logEmployerEvent(employer.id, 'מסמך הועלה', file.name)
      const d = await fetchEmployerDocList(employer.id); setDocs(d)
      const h = await fetchEmployerHistory(employer.id); setHistory(h)
    } catch (e) { alert('שגיאה בהעלאה') }
  }

  const INP = { padding: '10px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#111827', fontFamily: SANS, fontSize: 13, outline: 'none', width: '100%' }

  const row = (icon, label, val) => val ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{icon} {label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, textAlign: 'right', maxWidth: 260, wordBreak: 'break-word' }}>{val}</span>
    </div>
  ) : null

  const TABS = [
    { k: 'info',     label: '📋 פרטים'    },
    { k: 'workers',  label: `👥 עובדים (${myWorkers.length})` },
    { k: 'docs',     label: '📁 מסמכים'   },
    { k: 'notes',    label: '📝 תרשומת'   },
    { k: 'history',  label: '🕓 היסטוריה' },
  ]

  return (
    <div style={{ fontFamily: SANS }}>
      {confirmDel && <ConfirmDelete name={employer.name} onConfirm={async () => { await onDelete(employer.id); onBack() }} onCancel={() => setConfirmDel(false)} />}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F3F4F6', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, color: '#6B7280' }}>← חזרה</button>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', border: `1.5px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color, fontFamily: SANS }}>
          {employer.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', fontFamily: DISPLAY }}>{employer.name}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {employer.company_id && `ח.פ ${employer.company_id} · `}
            {SECTORS.find(s => s.v === employer.sector)?.he}
            {employer.city && ` · ${employer.city}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={employer.status} />
          {employer.phone && <a href={`tel:${employer.phone}`} style={{ background: '#F0FDF9', color: TEAL, border: `1.5px solid #CCFBF1`, borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: SANS }}>📞 התקשר</a>}
          {employer.contact_phone && <a href={`https://wa.me/${employer.contact_phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{ background: '#F0FDF9', color: '#15803D', border: `1.5px solid #CCFBF1`, borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: SANS }}>💬 WA</a>}
          <button onClick={() => setConfirmDel(true)} style={{ background: '#FFF1F2', color: '#BE123C', border: '1.5px solid #FECDD3', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>🗑️ מחק</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F3F4F6', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: tab === t.k ? `3px solid ${TEAL}` : '3px solid transparent', color: tab === t.k ? TEAL : '#6B7280', fontSize: 14, fontWeight: tab === t.k ? 700 : 500, cursor: 'pointer', fontFamily: SANS, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: '24px auto', padding: '0 20px 48px' }}>

        {/* ── TAB: INFO ── */}
        {tab === 'info' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>פרטי העסק</div>
              <button onClick={() => editMode ? saveInfo() : setEditMode(true)}
                style={{ padding: '8px 18px', background: editMode ? TEAL : '#F9FAFB', color: editMode ? 'white' : '#374151', border: `1.5px solid ${editMode ? TEAL : '#E5E7EB'}`, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                {saving ? 'שומר...' : editMode ? '💾 שמור' : '✏️ ערוך'}
              </button>
            </div>

            {editMode ? (
              <EmployerForm existing={form} onSave={async (updated) => { setForm(updated); await saveInfo() }} onCancel={() => setEditMode(false)} />
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 10 }}>פרטי העסק</div>
                  {row('🏢', 'שם', employer.name)}
                  {row('🆔', 'ח.פ / ע.מ', employer.company_id)}
                  {row('⚙️', 'ענף', SECTORS.find(s => s.v === employer.sector)?.he)}
                  {row('📍', 'כתובת', [employer.address, employer.city].filter(Boolean).join(', '))}
                  {row('📞', 'טלפון', employer.phone)}
                  {row('📧', 'אימייל', employer.email)}
                  {row('🌐', 'אתר', employer.website)}
                  {row('👷', 'מכסת עובדים', employer.workers_quota ? `${employer.workers_quota} עובדים` : null)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 10 }}>איש קשר</div>
                  {row('👤', 'שם', employer.contact_name)}
                  {row('💼', 'תפקיד', employer.contact_role)}
                  {row('📱', 'טלפון', employer.contact_phone)}
                  {row('📧', 'אימייל', employer.contact_email)}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>נוצר {fmtDate(employer.created_at)} · #{employer.id.slice(0, 8)}</div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: WORKERS ── */}
        {tab === 'workers' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
              👥 עובדים משובצים ({myWorkers.length})
            </div>
            {myWorkers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 14 }}>אין עובדים משובצים כרגע</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myWorkers.map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1.5px solid #F3F4F6' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{w.full_name_he || w.full_name_en}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{w.phone} · {SECTORS.find(s => s.v === w.sector)?.he}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>מאז {fmtDate(w.placement_date)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: DOCS ── */}
        {tab === 'docs' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>📁 מסמכי העסק</div>

            {/* Upload buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {[['license','רישיון עסק'],['contract','חוזה מסגרת'],['approval','אישור מעסיק'],['other','מסמך אחר']].map(([type, label]) => (
                <div key={type}>
                  <button onClick={() => { fileRef.current.dataset.type = type; fileRef.current.click() }}
                    style={{ padding: '8px 14px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, color: '#374151' }}>
                    📎 {label}
                  </button>
                </div>
              ))}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleUpload(fileRef.current.dataset.type, f) }} />
            </div>

            {/* Docs list */}
            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#D1D5DB', fontSize: 13 }}>אין מסמכים עדיין</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docs.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1.5px solid #F3F4F6' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.doc_name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{d.doc_type} · {fmtDate(d.uploaded_at)}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>הועלה ✓</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: NOTES ── */}
        {tab === 'notes' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>📝 תרשומת</div>
            <div style={{ background: '#F8FAFF', border: '1.5px solid #E0E7FF', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>תאריך</label>
                  <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} style={{ ...INP, width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>תרשומת</label>
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="כתוב תרשומת..." style={{ ...INP, width: '100%' }} onKeyDown={e => e.key === 'Enter' && addNote()} />
                </div>
              </div>
              <button onClick={addNote} style={{ width: '100%', padding: 10, background: noteText.trim() ? TEAL : '#E5E7EB', color: noteText.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: noteText.trim() ? 'pointer' : 'default', fontFamily: SANS }}>
                + הוסף תרשומת
              </button>
            </div>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#D1D5DB', fontSize: 13 }}>אין תרשומות עדיין</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: '#FAFAFA', border: '1.5px solid #F3F4F6', borderRadius: 11, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '6px 10px', textAlign: 'center', minWidth: 66 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(n.note_date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{new Date(n.note_date).getFullYear()}</div>
                    </div>
                    <div style={{ flex: 1, fontSize: 13, color: '#111827', lineHeight: 1.7, direction: 'rtl' }}>{n.text}</div>
                    <button onClick={() => removeNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 15, padding: '2px 4px' }} onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {tab === 'history' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>🕓 היסטוריה</div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#D1D5DB', fontSize: 13 }}>אין היסטוריה עדיין</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: 120 }}>{fmtDate(h.created_at)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{h.action}</div>
                      {h.details && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{h.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN EMPLOYERS MODULE ────────────────────────────────────────────────────
export default function Employers({ candidates = [] }) {
  const [employers, setEmployers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('list')  // list | card
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [filterSector, setFilter] = useState('')

  useEffect(() => {
    fetchEmployers().then(d => { setEmployers(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const add = async (form) => {
    const emp = await insertEmployer(form)
    await logEmployerEvent(emp.id, 'מעסיק נוצר', null)
    setEmployers(prev => [emp, ...prev])
    setShowForm(false)
  }

  const update = async (id, changes) => {
    await updateEmployer(id, changes)
    setEmployers(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e))
  }

  const remove = async (id) => {
    await deleteEmployer(id)
    setEmployers(prev => prev.filter(e => e.id !== id))
  }

  const filtered = employers.filter(e => {
    const q = search.toLowerCase()
    const ms = !q || [e.name, e.company_id, e.city, e.contact_name].some(v => (v || '').toLowerCase().includes(q))
    return ms && (!filterSector || e.sector === filterSector)
  })

  const selected = selectedId ? employers.find(e => e.id === selectedId) : null

  if (view === 'card' && selected) {
    return (
      <div style={{ fontFamily: SANS, background: '#F9FAFB', minHeight: 'calc(100vh - 62px)' }}>
        <EmployerCard employer={selected} candidates={candidates} onUpdate={update} onDelete={remove} onBack={() => { setView('list'); setSelectedId(null) }} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: SANS, padding: '20px 24px' }}>
      {showForm && <EmployerForm onSave={add} onCancel={() => setShowForm(false)} />}

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY }}>🏢 מעסיקים ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="🔍 חיפוש..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: SANS, background: 'white', minWidth: 180 }} />
          <select value={filterSector} onChange={e => setFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: SANS, background: 'white' }}>
            <option value=''>כל הענפים</option>
            {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '9px 20px', background: TEAL, color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
            + מעסיק חדש
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#D1D5DB' }}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>אין מעסיקים עדיין</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>הוסף את המעסיק הראשון שלך</div>
          <button onClick={() => setShowForm(true)} style={{ padding: '12px 28px', background: TEAL, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>+ הוסף מעסיק</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(e => {
            const color = SECTOR_COLORS[e.sector] || '#9CA3AF'
            const workerCount = candidates.filter(c => c.placement === e.name).length
            return (
              <div key={e.id} onClick={() => { setSelectedId(e.id); setView('card') }}
                style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,.04)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '18', border: `1.5px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color, fontFamily: SANS }}>
                    {e.name[0]}
                  </div>
                  <StatusBadge status={e.status} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{e.name}</div>
                {e.company_id && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>ח.פ {e.company_id}</div>}
                <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
                  {e.city && <span>📍 {e.city}</span>}
                  {e.contact_name && <span>👤 {e.contact_name}{e.contact_role ? ` · ${e.contact_role}` : ''}</span>}
                  {e.phone && <span>📞 {e.phone}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ background: color + '18', color, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                      {SECTORS.find(s => s.v === e.sector)?.he || 'ענף'}
                    </span>
                    {e.workers_quota && <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>מכסה: {e.workers_quota}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color }}>
                    {workerCount > 0 ? `${workerCount} עובדים` : '—'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
