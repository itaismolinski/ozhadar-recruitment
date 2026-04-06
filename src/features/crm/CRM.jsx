import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCandidates, updateCandidate, deleteCandidate, getDocUrl, uploadDoc, fetchTasks, insertTask, updateTask, deleteTask, fetchNotes, insertNote, deleteNote } from '../../lib/supabase.js'
import { SECTORS, PERMITS, STATUSES, DOC_FIELDS } from '../../constants.js'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SANS = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"
const TEAL = '#0F766E'

const HE_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת']

const fmtDate   = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'
const isExpired = d   => d && new Date(d) < new Date()
const isSoon    = d   => { if (!d) return false; const diff=(new Date(d)-new Date())/864e5; return diff>=0 && diff<45 }

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Badge({ status }) {
  const s = STATUSES.find(x => x.v === status) || STATUSES[0]
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: SANS }}>
      {s.he}
    </span>
  )
}

function Pill({ label, active, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${active ? color : '#E5E7EB'}`, background: active ? color + '18' : 'white', color: active ? color : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, transition: 'all .15s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function ConfirmDelete({ name, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: SANS }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🗑️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 8 }}>מחיקת מועמד</h3>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
          האם למחוק את <strong style={{ color: '#111827' }}>{name}</strong>?<br/>
          <span style={{ fontSize: 12, color: '#EF4444' }}>פעולה זו אינה ניתנת לביטול</span>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>
            ביטול
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
            מחק
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── NOTES TAB ────────────────────────────────────────────────────────────────

function NotesTab({ candidateId }) {
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText]       = useState('')
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    fetchNotes(candidateId)
      .then(d => { setNotes(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [candidateId])

  const add = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const n = await insertNote({ candidate_id: candidateId, note_date: date, text: text.trim() })
      setNotes(prev => [n, ...prev])
      setText('')
      setDate(new Date().toISOString().split('T')[0])
    } catch(e) { alert('שגיאה בשמירה') }
    setSaving(false)
  }

  const remove = async (id) => {
    await deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const INP = { padding: '10px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#111827', fontFamily: SANS, fontSize: 13, outline: 'none', width: '100%' }

  return (
    <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: DISPLAY, marginBottom: 18, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
        📝 תרשומות
      </div>

      {/* Add note form */}
      <div style={{ background: '#F8FAFF', border: '1.5px solid #E0E7FF', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: SANS }}>תאריך</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: SANS }}>תרשומת</label>
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="כתוב תרשומת חדשה..." style={INP}
              onKeyDown={e => e.key === 'Enter' && add()} />
          </div>
        </div>
        <button onClick={add} disabled={saving || !text.trim()}
          style={{ width: '100%', padding: '10px', background: text.trim() ? TEAL : '#E5E7EB', color: text.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: SANS, transition: 'all .15s' }}>
          {saving ? 'שומר...' : '+ הוסף תרשומת'}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#D1D5DB', fontFamily: SANS }}>טוען...</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#D1D5DB', fontSize: 13, fontFamily: SANS }}>אין תרשומות עדיין</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 14, padding: '13px 16px', background: '#FAFAFA', border: '1.5px solid #F3F4F6', borderRadius: 11, alignItems: 'flex-start' }}>
              {/* Date badge */}
              <div style={{ flexShrink: 0, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '6px 10px', textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: SANS }}>
                  {new Date(n.note_date).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: SANS }}>
                  {new Date(n.note_date).getFullYear()}
                </div>
              </div>
              {/* Text */}
              <div style={{ flex: 1, fontSize: 14, color: '#111827', lineHeight: 1.7, direction: 'rtl', fontFamily: SANS }}>
                {n.text}
              </div>
              {/* Delete */}
              <button onClick={() => remove(n.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 15, padding: '2px 4px', borderRadius: 6, flexShrink: 0, transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WORKER CARD (full page) ──────────────────────────────────────────────────

function WorkerCard({ candidate, onUpdate, onDelete, onBack }) {
  const [tab, setTab] = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ ...candidate })
  const [loadingDoc, setLoadingDoc] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRefs = useRef({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    const changes = {
      full_name_he: form.full_name_he, full_name_en: form.full_name_en,
      phone: form.phone, email: form.email, dob: form.dob || null,
      country: form.country, city: form.city, sector: form.sector,
      profession: form.profession, experience: form.experience,
      permit_type: form.permit_type, permit_number: form.permit_number,
      permit_expiry: form.permit_expiry || null, entry_date: form.entry_date || null,
      current_employer: form.current_employer, last_employer: form.last_employer,
      notes: form.notes, placement: form.placement,
      placement_date: form.placement_date || null, placement_notes: form.placement_notes,
      status: form.status,
    }
    await onUpdate(candidate.id, changes)
    setSaving(false)
    setEditMode(false)
  }

  const viewDoc = async (field) => {
    setLoadingDoc(field)
    const url = await getDocUrl(candidate.id, field)
    setLoadingDoc(null)
    if (url) window.open(url, '_blank')
    else alert('מסמך לא נמצא')
  }

  const handleUploadDoc = async (field, file) => {
    setUploadingDoc(field)
    try {
      await uploadDoc(candidate.id, field, file)
      const flagKey = `doc_${field}`
      await onUpdate(candidate.id, { [flagKey]: true })
      setForm(f => ({ ...f, [flagKey]: true }))
      alert('המסמך הועלה בהצלחה')
    } catch (e) { alert('שגיאה בהעלאה') }
    setUploadingDoc(null)
  }

  const name = candidate.full_name_he || candidate.full_name_en || '—'
  const phone = candidate.phone

  const INP = { padding: '10px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#111827', fontFamily: SANS, fontSize: 13, outline: 'none', width: '100%' }
  const row = (icon, label, val, danger) => val ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{icon} {label}</span>
      <span style={{ fontSize: 13, color: danger ? '#DC2626' : '#111827', fontWeight: 500, textAlign: 'right', direction: 'rtl', maxWidth: 220, wordBreak: 'break-word' }}>{val}</span>
    </div>
  ) : null

  const TABS = [
    { k: 'info',      label: '📋 פרטים'    },
    { k: 'placement', label: '🏢 שיבוץ'    },
    { k: 'docs',      label: '📁 מסמכים'   },
    { k: 'notes',     label: '📝 הערות'    },
  ]

  return (
    <div style={{ fontFamily: SANS }}>
      {confirmDel && (
        <ConfirmDelete name={name}
          onConfirm={async () => { await onDelete(candidate.id); onBack() }}
          onCancel={() => setConfirmDel(false)} />
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F3F4F6', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, color: '#6B7280' }}>
          ← חזרה
        </button>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', fontFamily: DISPLAY }}>{name}</div>
          {candidate.full_name_en && candidate.full_name_he && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{candidate.full_name_en}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge status={form.status} />
          {phone && (
            <>
              <a href={`tel:${phone}`} style={{ background: '#F0FDF4', color: TEAL, border: '1.5px solid #CCFBF1', borderRadius: 9, padding: '8px 13px', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: SANS }}>📞 התקשר</a>
              <a href={`https://wa.me/${phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{ background: '#F0FDF4', color: '#15803D', border: '1.5px solid #CCFBF1', borderRadius: 9, padding: '8px 13px', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: SANS }}>💬 WhatsApp</a>
            </>
          )}
          <button onClick={() => setConfirmDel(true)} style={{ background: '#FFF1F2', color: '#BE123C', border: '1.5px solid #FECDD3', borderRadius: 9, padding: '8px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>🗑️ מחק</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F3F4F6', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '13px 16px', background: 'none', border: 'none', borderBottom: tab === t.k ? `3px solid ${TEAL}` : '3px solid transparent', color: tab === t.k ? TEAL : '#6B7280', fontSize: 14, fontWeight: tab === t.k ? 700 : 500, cursor: 'pointer', fontFamily: SANS, whiteSpace: 'nowrap', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '24px auto', padding: '0 20px 48px' }}>

        {/* STATUS CHANGER - always visible */}
        <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '14px 18px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 10 }}>סטטוס מועמד</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s.v} onClick={async () => { set('status', s.v); await onUpdate(candidate.id, { status: s.v }) }}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${form.status === s.v ? s.fg : '#E5E7EB'}`, background: form.status === s.v ? s.bg : 'white', color: form.status === s.v ? s.fg : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, transition: 'all .15s' }}>
                {s.he}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: INFO */}
        {tab === 'info' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: DISPLAY }}>פרטים אישיים ומקצועיים</div>
              <button onClick={() => editMode ? save() : setEditMode(true)}
                style={{ padding: '8px 18px', background: editMode ? TEAL : '#F9FAFB', color: editMode ? 'white' : '#374151', border: `1.5px solid ${editMode ? TEAL : '#E5E7EB'}`, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                {saving ? 'שומר...' : editMode ? '💾 שמור' : '✏️ ערוך'}
              </button>
            </div>

            {editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['שם עברית','full_name_he'], ['שם אנגלית','full_name_en'],
                  ['טלפון','phone'], ['אימייל','email'],
                  ['מדינה','country'], ['עיר','city'],
                  ['ענף','sector'], ['מקצוע','profession'],
                  ['ניסיון (שנים)','experience'], ['מעסיק נוכחי','current_employer'],
                  ['מעסיק אחרון','last_employer'], ['מספר היתר','permit_number'],
                ].map(([label, k]) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: SANS }}>{label}</label>
                    <input value={form[k] || ''} onChange={e => set(k, e.target.value)} style={INP} />
                  </div>
                ))}
                {[['תוקף ויזה','permit_expiry'],['כניסה לישראל','entry_date'],['ת.לידה','dob']].map(([label,k]) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: SANS }}>{label}</label>
                    <input type="date" value={form[k] || ''} onChange={e => set(k, e.target.value)} style={INP} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {row('📱', 'טלפון', candidate.phone)}
                {row('📧', 'אימייל', candidate.email)}
                {row('🌍', 'מדינה', candidate.country?.split('/')[0]?.trim())}
                {row('📍', 'עיר', candidate.city?.split('/')[0]?.trim())}
                {row('🎂', 'ת.לידה', candidate.dob ? fmtDate(candidate.dob) : null)}
                {row('⚙️', 'ענף', SECTORS.find(s => s.v === candidate.sector)?.he)}
                {row('🔧', 'מקצוע', candidate.profession?.split('/')[0]?.trim())}
                {row('📅', 'ניסיון', candidate.experience ? `${candidate.experience} שנים` : null)}
                {row('🏢', 'מעסיק נוכחי', candidate.current_employer)}
                {row('🏛️', 'מעסיק אחרון', candidate.last_employer)}
                {row('🪪', 'ויזה', PERMITS.find(p => p.v === candidate.permit_type)?.l)}
                {row('🔢', 'מספר היתר', candidate.permit_number)}
                {candidate.entry_date && row('✈️', 'כניסה לישראל', fmtDate(candidate.entry_date))}
                {candidate.permit_expiry && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>⏱ תוקף ויזה</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isExpired(candidate.permit_expiry) ? '#DC2626' : isSoon(candidate.permit_expiry) ? '#D97706' : '#111827' }}>
                      {fmtDate(candidate.permit_expiry)} {isExpired(candidate.permit_expiry) ? '🔴 פג' : isSoon(candidate.permit_expiry) ? '🟡 קרוב לפוג' : ''}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>נרשם {fmtDate(candidate.created_at)} · #{candidate.id.slice(0, 8)}</div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PLACEMENT */}
        {tab === 'placement' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: DISPLAY, marginBottom: 18, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
              🏢 שיבוץ למקום עבודה
            </div>

            {candidate.placement && (
              <div style={{ background: '#F0FDF9', border: '1.5px solid #CCFBF1', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: TEAL, fontWeight: 700, marginBottom: 4, letterSpacing: '.5px', textTransform: 'uppercase' }}>שיבוץ נוכחי</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{candidate.placement}</div>
                {candidate.placement_date && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>מתאריך: {fmtDate(candidate.placement_date)}</div>}
                {candidate.placement_notes && <div style={{ fontSize: 13, color: '#374151', marginTop: 6, direction: 'rtl', lineHeight: 1.6 }}>{candidate.placement_notes}</div>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, fontFamily: SANS }}>מקום עבודה / Employer</label>
                <input value={form.placement || ''} onChange={e => set('placement', e.target.value)}
                  placeholder="שם החברה / מקום העבודה"
                  style={{ ...INP, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, fontFamily: SANS }}>תאריך שיבוץ / Placement Date</label>
                <input type="date" value={form.placement_date || ''} onChange={e => set('placement_date', e.target.value)} style={INP} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, fontFamily: SANS }}>הערות שיבוץ / Placement Notes</label>
                <textarea value={form.placement_notes || ''} onChange={e => set('placement_notes', e.target.value)}
                  placeholder="פרטים נוספים על השיבוץ..."
                  rows={3} style={{ ...INP, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <button onClick={async () => { setSaving(true); await onUpdate(candidate.id, { placement: form.placement, placement_date: form.placement_date || null, placement_notes: form.placement_notes }); setSaving(false); alert('השיבוץ נשמר') }}
                style={{ padding: '12px', background: TEAL, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                {saving ? 'שומר...' : '💾 שמור שיבוץ'}
              </button>
            </div>
          </div>
        )}

        {/* TAB: DOCS */}
        {tab === 'docs' && (
          <div style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: DISPLAY, marginBottom: 18, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
              📁 מסמכים
            </div>
            {DOC_FIELDS.map(d => {
              const hasDoc = form[`doc_${d.k}`] || candidate[`doc_${d.k}`]
              return (
                <div key={d.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginBottom: 8, background: '#F9FAFB', borderRadius: 10, border: '1.5px solid #F3F4F6' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: SANS }}>{d.he}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: SANS }}>{d.en}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {hasDoc ? (
                      <button onClick={() => viewDoc(d.k)} disabled={loadingDoc === d.k}
                        style={{ padding: '7px 14px', background: '#F0FDF9', color: TEAL, border: `1.5px solid #CCFBF1`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                        {loadingDoc === d.k ? '...' : '👁 צפה'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#D1D5DB', fontFamily: SANS }}>לא הועלה</span>
                    )}
                    <button onClick={() => fileRefs.current[d.k]?.click()}
                      style={{ padding: '7px 14px', background: hasDoc ? '#FFF1F2' : '#F9FAFB', color: hasDoc ? '#BE123C' : '#6B7280', border: `1.5px solid ${hasDoc ? '#FECDD3' : '#E5E7EB'}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
                      {uploadingDoc === d.k ? '...' : hasDoc ? '🔄 החלף' : '📎 העלה'}
                    </button>
                    <input ref={el => fileRefs.current[d.k] = el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleUploadDoc(d.k, f) }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TAB: NOTES */}
        {tab === 'notes' && (
          <NotesTab candidateId={candidate.id} />
        )}
      </div>
    </div>
  )
}

// ─── ALPHON VIEW ──────────────────────────────────────────────────────────────

function AlphonView({ candidates, onSelect }) {
  const [letter, setLetter] = useState('הכל')
  const filtered = letter === 'הכל'
    ? candidates
    : candidates.filter(c => (c.full_name_he || '').startsWith(letter))

  return (
    <div style={{ padding: '20px 24px', fontFamily: SANS }}>
      {/* Letter filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <Pill label="הכל" active={letter === 'הכל'} onClick={() => setLetter('הכל')} color={TEAL} />
        {HE_LETTERS.map(l => {
          const count = candidates.filter(c => (c.full_name_he || '').startsWith(l)).length
          return count > 0 ? (
            <Pill key={l} label={`${l} (${count})`} active={letter === l} onClick={() => setLetter(l)} color={TEAL} />
          ) : null
        })}
      </div>

      <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>{filtered.length} מועמדים</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {filtered.map(c => {
          const expired = isExpired(c.permit_expiry)
          const soon = isSoon(c.permit_expiry)
          return (
            <div key={c.id} onClick={() => onSelect(c)}
              style={{ background: 'white', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,.04)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', direction: 'rtl' }}>{c.full_name_he || c.full_name_en || '—'}</div>
                  {c.full_name_he && c.full_name_en && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.full_name_en}</div>}
                </div>
                <Badge status={c.status} />
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {c.phone && <span>📱 {c.phone}</span>}
                {c.sector && <span>⚙️ {SECTORS.find(s => s.v === c.sector)?.he}</span>}
                {c.permit_expiry && (
                  <span style={{ color: expired ? '#DC2626' : soon ? '#D97706' : '#6B7280', fontWeight: (expired || soon) ? 700 : 400 }}>
                    ⏱ {fmtDate(c.permit_expiry)} {expired ? '🔴' : soon ? '🟡' : ''}
                  </span>
                )}
                {c.placement && <span style={{ color: TEAL, fontWeight: 600 }}>🏢 {c.placement}</span>}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#D1D5DB', fontSize: 14 }}>
            אין מועמדים עם שם המתחיל ב-{letter}
          </div>
        )}
      </div>
    </div>
  )
}


const STAFF = ['איתי','נציג 1','נציג 2','נציג 3'] // ניתן להוסיף

function TasksPanel({ candidates }) {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterStatus, setFilterStatus]     = useState('open')
  const [form, setForm] = useState({ title:'', description:'', assigned_to:'', candidate_id:'', due_date:'' })

  useEffect(() => {
    fetchTasks().then(d => { setTasks(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const add = async () => {
    if (!form.title.trim()) return
    const rec = {
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      candidate_id: form.candidate_id || null,
      due_date: form.due_date || null,
      status: 'open',
    }
    const t = await insertTask(rec)
    setTasks(prev => [t, ...prev])
    setForm({ title:'', description:'', assigned_to:'', candidate_id:'', due_date:'' })
    setShowForm(false)
  }

  const toggle = async (task) => {
    const newStatus = task.status === 'open' ? 'done' : 'open'
    await updateTask(task.id, { status: newStatus })
    setTasks(prev => prev.map(t => t.id === task.id ? {...t, status: newStatus} : t))
  }

  const remove = async (id) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => {
    return (
      (!filterAssignee || t.assigned_to === filterAssignee) &&
      (!filterStatus   || t.status === filterStatus)
    )
  })

  const open = tasks.filter(t => t.status === 'open').length
  const done = tasks.filter(t => t.status === 'done').length

  const INP = { padding: '10px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#111827', fontFamily: SANS, fontSize: 13, outline: 'none', width: '100%' }
  const SEL = { ...INP, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }
  const fmtD = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : null
  const isOver = d => d && new Date(d) < new Date()

  return (
    <div style={{ fontFamily: SANS }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: DISPLAY }}>משימות לביצוע</h3>
          <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{open} פתוחות</span>
          <span style={{ background: '#F0FDF4', color: '#166534', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{done} הושלמו</span>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding: '9px 18px', background: TEAL, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
          {showForm ? '✕ סגור' : '+ משימה חדשה'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#F8FAFF', border: '1.5px solid #E0E7FF', borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>כותרת המשימה *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="תאר את המשימה בקצרה..." style={INP} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>מי מבצע / Assigned to</label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={SEL}>
                <option value=''>— בחר —</option>
                {STAFF.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>תאריך יעד</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={INP} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>שייך למועמד (אופציונלי)</label>
              <select value={form.candidate_id} onChange={e => set('candidate_id', e.target.value)} style={SEL}>
                <option value=''>— ללא שיוך —</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name_he || c.full_name_en || c.phone}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>פרטים נוספים</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="הוסף פרטים..." rows={2}
                style={{ ...INP, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={add}
              style={{ flex: 1, padding: '11px', background: TEAL, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
              ✓ הוסף משימה
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '11px 20px', background: '#F9FAFB', color: '#9CA3AF', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['open','פתוחות'],['done','הושלמו'],['','הכל']].map(([v,l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${filterStatus===v ? TEAL : '#E5E7EB'}`, background: filterStatus===v ? TEAL+'18' : 'white', color: filterStatus===v ? TEAL : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
            {l}
          </button>
        ))}
        {STAFF.length > 0 && (
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            style={{ padding: '5px 12px', border: '1.5px solid #E5E7EB', borderRadius: 20, fontSize: 12, color: '#6B7280', fontFamily: SANS, outline: 'none', background: 'white', cursor: 'pointer' }}>
            <option value=''>כל הנציגים</option>
            {STAFF.map(s => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#D1D5DB' }}>טוען משימות...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#D1D5DB', fontSize: 14 }}>אין משימות</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const cand = candidates.find(c => c.id === t.candidate_id)
            const over = isOver(t.due_date) && t.status === 'open'
            const done = t.status === 'done'
            return (
              <div key={t.id} style={{
                background: done ? '#F9FAFB' : 'white',
                border: `1.5px solid ${over ? '#FECDD3' : done ? '#F3F4F6' : '#F3F4F6'}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                opacity: done ? .7 : 1, transition: 'all .15s',
                boxShadow: done ? 'none' : '0 1px 4px rgba(0,0,0,.04)',
              }}>
                {/* Checkbox */}
                <button onClick={() => toggle(t)}
                  style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? TEAL : '#D1D5DB'}`, background: done ? TEAL : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1, transition: 'all .15s' }}>
                  {done && <span style={{ color: 'white', fontSize: 13, lineHeight: 1 }}>✓</span>}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: done ? 400 : 600, color: done ? '#9CA3AF' : '#111827', textDecoration: done ? 'line-through' : 'none', marginBottom: 4 }}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 6, direction: 'rtl' }}>{t.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {t.assigned_to && (
                      <span style={{ fontSize: 11, background: '#EEF2FF', color: '#4F46E5', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
                        👤 {t.assigned_to}
                      </span>
                    )}
                    {cand && (
                      <span style={{ fontSize: 11, background: '#F0FDF9', color: TEAL, padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
                        🔗 {cand.full_name_he || cand.full_name_en}
                      </span>
                    )}
                    {t.due_date && (
                      <span style={{ fontSize: 11, background: over ? '#FFF1F2' : '#F9FAFB', color: over ? '#BE123C' : '#9CA3AF', padding: '2px 9px', borderRadius: 20, fontWeight: over ? 700 : 400 }}>
                        📅 {fmtD(t.due_date)} {over ? '⚠️ עבר המועד' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button onClick={() => remove(t.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 15, padding: '2px', borderRadius: 6, flexShrink: 0, transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ─── MAIN CRM ─────────────────────────────────────────────────────────────────

export default function CRM() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [view, setView]             = useState('list') // list | alphon | worker
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch]         = useState('')
  const [filterSector, setSector]   = useState('')
  const [filterStatus, setStatus]   = useState('')

  const load = useCallback(async () => {
    try { const d = await fetchCandidates(); setCandidates(d) }
    catch (e) { setError('שגיאה: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const update = async (id, changes) => {
    await updateCandidate(id, changes)
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  const remove = async (id) => {
    await deleteCandidate(id)
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    const ms = !q || [c.full_name_he, c.full_name_en, c.phone, c.permit_number, c.placement].some(v => (v || '').toLowerCase().includes(q))
    return ms && (!filterSector || c.sector === filterSector) && (!filterStatus || c.status === filterStatus)
  })

  const exportCSV = () => {
    const headers = ['שם עברית','שם אנגלית','טלפון','אימייל','מדינה','עיר','ענף','מקצוע','ניסיון','ויזה','מספר היתר','תוקף','כניסה','מעסיק נוכחי','מעסיק אחרון','שיבוץ','תאריך שיבוץ','סטטוס','נרשם']
    const rows = candidates.map(c => [
      c.full_name_he, c.full_name_en, c.phone, c.email, c.country, c.city,
      SECTORS.find(s => s.v === c.sector)?.he, c.profession, c.experience,
      PERMITS.find(p => p.v === c.permit_type)?.l, c.permit_number,
      c.permit_expiry, c.entry_date, c.current_employer, c.last_employer,
      c.placement, c.placement_date,
      STATUSES.find(s => s.v === c.status)?.he, fmtDate(c.created_at)
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 62px)', color: '#9CA3AF', fontFamily: SANS }}>טוען...</div>
  if (error)   return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 62px)', color: '#EF4444', fontFamily: SANS }}>{error}</div>

  const selected = selectedId ? candidates.find(c => c.id === selectedId) : null

  // Worker card view
  if (view === 'worker' && selected) {
    return (
      <div style={{ fontFamily: SANS, background: '#F9FAFB', minHeight: 'calc(100vh - 62px)' }}>
        <WorkerCard
          candidate={selected}
          onUpdate={update}
          onDelete={remove}
          onBack={() => { setView('list'); setSelectedId(null) }}
        />
      </div>
    )
  }

  const TH = ({ c }) => <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#6B7280', fontSize: 11, letterSpacing: '.5px', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: SANS }}>{c}</th>

  return (
    <div style={{ fontFamily: SANS, background: '#F9FAFB', minHeight: 'calc(100vh - 62px)' }}>

      {/* View switcher bar */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F3F4F6', padding: '0 24px', display: 'flex', gap: 4 }}>
        {[{ k: 'list', label: '📊 רשימה' }, { k: 'alphon', label: '🔤 אלפון' }].map(v => (
          <button key={v.k} onClick={() => setView(v.k)}
            style={{ padding: '13px 18px', background: 'none', border: 'none', borderBottom: view === v.k ? `3px solid ${TEAL}` : '3px solid transparent', color: view === v.k ? TEAL : '#6B7280', fontSize: 14, fontWeight: view === v.k ? 700 : 500, cursor: 'pointer', fontFamily: SANS, transition: 'all .15s' }}>
            {v.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <button onClick={load} style={{ padding: '7px 13px', background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: 9, fontSize: 12, color: '#4F46E5', fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>↻ רענן</button>
          <button onClick={exportCSV} style={{ padding: '7px 13px', background: '#F0FDF4', border: '1.5px solid #CCFBF1', borderRadius: 9, fontSize: 12, color: TEAL, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>⬇ CSV</button>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{candidates.length} מועמדים</span>
        </div>
      </div>

      {/* ALPHON VIEW */}
      {view === 'alphon' && (
        <AlphonView candidates={candidates} onSelect={c => { setSelectedId(c.id); setView('worker') }} />
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ padding: '20px 24px' }}>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <input placeholder="🔍 חיפוש שם / טלפון / מספר / שיבוץ..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: SANS, background: 'white' }} />
            <select value={filterSector} onChange={e => setSector(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, background: 'white', fontFamily: SANS, outline: 'none' }}>
              <option value=''>כל הענפים</option>
              {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setStatus(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, background: 'white', fontFamily: SANS, outline: 'none' }}>
              <option value=''>כל הסטטוסים</option>
              {STATUSES.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>{filtered.length} תוצאות</span>
          </div>

          {/* Status summary cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto' }}>
            {STATUSES.map(s => {
              const cnt = candidates.filter(c => c.status === s.v).length
              const active = filterStatus === s.v
              return (
                <div key={s.v} onClick={() => setStatus(active ? '' : s.v)}
                  style={{ flex: 1, minWidth: 80, background: active ? s.bg : 'white', border: `1.5px solid ${active ? s.fg : '#F3F4F6'}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: active ? s.fg : '#374151', fontFamily: SANS }}>{cnt}</div>
                  <div style={{ fontSize: 11, color: active ? s.fg : '#9CA3AF', fontWeight: 600, fontFamily: SANS }}>{s.he}</div>
                </div>
              )
            })}
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1.5px solid #F3F4F6' }}>
                  <TH c='שם' /><TH c='טלפון' /><TH c='מדינה' /><TH c='ענף' /><TH c='ויזה' /><TH c='תוקף' /><TH c='שיבוץ' /><TH c='סטטוס' /><TH c='נרשם' /><TH c='' />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 60, color: '#D1D5DB', fontFamily: SANS }}>אין מועמדים תואמים</td></tr>
                )}
                {filtered.map(c => {
                  const expired = isExpired(c.permit_expiry)
                  const soon = isSoon(c.permit_expiry)
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: '1px solid #F9FAFB', transition: 'background .1s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', fontWeight: 700, color: '#111827', direction: 'rtl', whiteSpace: 'nowrap' }}>{c.full_name_he || c.full_name_en || '—'}</td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', color: '#374151', direction: 'ltr', whiteSpace: 'nowrap' }}>{c.phone || '—'}</td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', color: '#6B7280', fontSize: 12 }}>{(c.country || '—').split('/')[0].trim()}</td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', color: '#374151' }}>{SECTORS.find(s => s.v === c.sector)?.he || '—'}</td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', color: '#6B7280', fontSize: 12 }}>{PERMITS.find(p => p.v === c.permit_type)?.l || '—'}</td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: expired ? '#DC2626' : soon ? '#D97706' : '#374151', fontWeight: (expired || soon) ? 700 : 400 }}>
                          {c.permit_expiry ? fmtDate(c.permit_expiry) : '—'} {expired ? '🔴' : soon ? '🟡' : ''}
                        </span>
                      </td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', fontSize: 12, color: c.placement ? TEAL : '#D1D5DB', fontWeight: c.placement ? 600 : 400 }}>
                        {c.placement || '—'}
                      </td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px' }}><Badge status={c.status} /></td>
                      <td onClick={() => { setSelectedId(c.id); setView('worker') }} style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                      <td style={{ padding: '11px 10px' }}>
                        <button onClick={e => { e.stopPropagation(); if (window.confirm(`למחוק את ${c.full_name_he || c.full_name_en}?`)) remove(c.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 16, padding: '2px 6px', borderRadius: 6, transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
