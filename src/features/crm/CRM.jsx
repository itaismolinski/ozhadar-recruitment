import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchCandidates, updateCandidate, deleteCandidate, getDocUrl, uploadDoc,
  fetchTasks, insertTask, updateTask, deleteTask,
  fetchNotes, insertNote, deleteNote,
} from '../../lib/supabase.js'
import { SECTORS, PERMITS, STATUSES, DOC_FIELDS } from '../../constants.js'
import { supabase } from '../../lib/supabase.js'

// ─── DESIGN TOKENS 2026 ──────────────────────────────────────────────────────
const F       = "'Heebo', 'Inter', -apple-system, 'Arial Hebrew', Arial, sans-serif"
const BLUE    = '#0066FF'
const BLUE_D  = '#0052CC'
const BLUE_L  = 'rgba(0,102,255,0.07)'
const BLUE_M  = 'rgba(0,102,255,0.13)'
const DARK    = '#0F1117'
const DARK2   = '#1A1F2E'
const GRAY    = '#64748B'
const GRAY2   = '#94A3B8'
const LGRAY   = '#F1F5F9'
const CREAM   = '#F8FAFC'
const BORDER  = '#E2E8F0'
const BORDER2 = '#CBD5E1'
const WHITE   = '#FFFFFF'
const SIDEBAR_BG     = '#FFFFFF'
const SIDEBAR_HOVER  = '#F3F4F6'
const SIDEBAR_ACTIVE = '#EEF2FF'
const SHADOW_XS  = '0 1px 2px rgba(0,0,0,.05)'
const SHADOW_SM  = '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)'
const SHADOW_MD  = '0 4px 16px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04)'
const SHADOW_LG  = '0 16px 48px rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.06)'
const SHADOW_CARD = '0 0 0 1px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.05)'

const STAFF = ['איתי', 'דוד', 'הודיה', 'מור']

// Extended worker statuses (override constants)
const WORKER_STATUS_LIST = [
  { v: 'active',       he: '● פעיל',      bg: '#F0FDF4', fg: '#15803D', dot: '#16A34A' },
  { v: 'new',          he: '● חדש',       bg: '#EEF2FF', fg: '#4338CA', dot: '#6366F1' },
  { v: 'in_treatment', he: '● בטיפול',    bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6' },
  { v: 'injured',      he: '● פצוע',      bg: '#FFF7ED', fg: '#C2410C', dot: '#F97316' },
  { v: 'escaped',      he: '● ברחן',      bg: '#FFF1F2', fg: '#BE123C', dot: '#E11D48' },
  { v: 'inactive',     he: '● לא פעיל',   bg: '#F8FAFC', fg: '#64748B', dot: '#94A3B8' },
]

const fmtDate   = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'
const isExpired = d => d && new Date(d) < new Date()
const isSoon    = d => { if (!d) return false; const diff = (new Date(d) - new Date()) / 864e5; return diff >= 0 && diff < 45 }

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function useStyles() {
  useEffect(() => {
    if (document.getElementById('crm-v2-styles')) return
    const s = document.createElement('style')
    s.id = 'crm-v2-styles'
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { font-size: 14px; }
      body { font-family: ${F}; -webkit-font-smoothing: antialiased; background: ${CREAM}; }

      /* ── SCROLLBARS ─────────────────── */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 99px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.2); }

      /* ── INPUTS ─────────────────────── */
      .v2-input {
        width: 100%; padding: 9px 13px;
        background: ${WHITE}; border: 1.5px solid ${BORDER};
        border-radius: 10px; font-size: 13.5px; font-family: inherit;
        color: ${DARK}; outline: none; transition: border-color .15s, box-shadow .15s;
      }
      .v2-input:focus {
        border-color: ${BLUE};
        box-shadow: 0 0 0 3px rgba(0,102,255,.09);
      }
      .v2-input::placeholder { color: #B0BAC9; }
      .v2-select { appearance: none; -webkit-appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 10px center; padding-left: 28px !important; }

      /* ── BUTTONS ─────────────────────── */
      .v2-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 16px; border: none; border-radius: 10px;
        font-size: 13px; font-weight: 600; font-family: inherit;
        cursor: pointer; transition: all .15s; white-space: nowrap;
      }
      .v2-btn-primary {
        background: ${BLUE}; color: ${WHITE};
        box-shadow: 0 1px 3px rgba(0,102,255,.25), 0 0 0 1px rgba(0,102,255,.1);
      }
      .v2-btn-primary:hover {
        background: ${BLUE_D}; transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0,102,255,.32), 0 0 0 1px rgba(0,102,255,.15);
      }
      .v2-btn-primary:active { transform: translateY(0); box-shadow: none; }
      .v2-btn-ghost {
        background: transparent; color: ${GRAY};
        border: 1.5px solid transparent;
      }
      .v2-btn-ghost:hover { background: ${LGRAY}; color: ${DARK}; border-color: ${BORDER}; }
      .v2-btn-danger { background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; }
      .v2-btn-danger:hover { background: #FEE2E2; border-color: #FCA5A5; }

      /* ── SIDEBAR NAV ─────────────────── */
      .nav-btn {
        display: flex; align-items: center; gap: 10px; padding: 9px 11px;
        border-radius: 9px; cursor: pointer;
        color: rgba(255,255,255,.38); font-size: 13px; font-weight: 500;
        border: none; background: none; font-family: inherit;
        width: 100%; text-align: right; transition: all .13s; letter-spacing: -.1px;
      }
      .nav-btn:hover { background: rgba(255,255,255,.058); color: rgba(255,255,255,.75); }
      .nav-btn.active {
        background: linear-gradient(135deg, rgba(0,102,255,.22), rgba(0,102,255,.12));
        color: #7BB8FF; font-weight: 700;
        box-shadow: inset 1px 0 0 0 rgba(0,102,255,.5);
      }
      .nav-icon {
        width: 19px; height: 19px; display: flex; align-items: center;
        justify-content: center; font-size: 14px; flex-shrink: 0; opacity: .6;
      }
      .nav-btn.active .nav-icon { opacity: 1; }
      .nav-badge {
        background: ${BLUE}; color: ${WHITE}; border-radius: 6px;
        font-size: 10px; font-weight: 800; padding: 2px 6px; line-height: 1.4;
        min-width: 18px; text-align: center;
      }

      /* ── TABLE ───────────────────────── */
      .v2-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
      .v2-table th {
        padding: 10px 16px; text-align: right; font-weight: 700; color: ${GRAY2};
        font-size: 10.5px; letter-spacing: .6px; text-transform: uppercase;
        background: ${LGRAY}; border-bottom: 1.5px solid ${BORDER};
        white-space: nowrap; user-select: none;
      }
      .v2-table td {
        padding: 13px 16px; border-bottom: 1px solid rgba(226,232,240,.7);
        color: ${DARK}; vertical-align: middle;
      }
      .v2-table tbody tr { cursor: pointer; transition: background .08s; }
      .v2-table tbody tr:hover td {
        background: rgba(0,102,255,.035);
      }
      .v2-table tbody tr:last-child td { border-bottom: none; }

      /* ── CARDS ───────────────────────── */
      .v2-card {
        background: ${WHITE}; border-radius: 14px;
        border: 1px solid ${BORDER}; box-shadow: ${SHADOW_CARD};
      }
      .v2-card-hover { transition: all .2s; }
      .v2-card-hover:hover {
        box-shadow: 0 0 0 1px rgba(0,102,255,.12), 0 8px 24px rgba(0,0,0,.08);
        transform: translateY(-2px); border-color: rgba(0,102,255,.15);
      }

      /* ── TOP BAR ─────────────────────── */
      .crm-topbar {
        background: ${WHITE}; border-bottom: 1px solid ${BORDER};
        position: sticky; top: 0; z-index: 50;
        box-shadow: 0 1px 0 ${BORDER};
      }

      /* ── BADGES ──────────────────────── */
      .badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px; border-radius: 99px;
        font-size: 11.5px; font-weight: 600; white-space: nowrap;
      }
      .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }

      /* ── TABS ────────────────────────── */
      .tab-btn {
        padding: 11px 16px; background: none; border: none;
        border-bottom: 2.5px solid transparent; color: ${GRAY};
        font-size: 13.5px; font-weight: 500; cursor: pointer;
        font-family: inherit; transition: all .13s; white-space: nowrap;
        letter-spacing: -.1px;
      }
      .tab-btn.active { border-bottom-color: ${BLUE}; color: ${BLUE}; font-weight: 700; }
      .tab-btn:hover:not(.active) { color: ${DARK}; }

      /* ── STAT CARDS ──────────────────── */
      .stat-card {
        background: ${WHITE}; border-radius: 16px; border: 1px solid ${BORDER};
        padding: 22px 22px 20px; box-shadow: ${SHADOW_CARD};
        transition: all .2s; cursor: pointer; position: relative; overflow: hidden;
      }
      .stat-card::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0) 60%, rgba(0,0,0,.01));
      }
      .stat-card:hover {
        box-shadow: 0 0 0 1.5px rgba(0,102,255,.15), 0 10px 30px rgba(0,0,0,.08);
        transform: translateY(-2px);
      }

      /* ── DRAG ZONE ───────────────────── */
      .drag-zone {
        border: 2px dashed ${BORDER2}; border-radius: 14px; padding: 36px;
        text-align: center; cursor: pointer; transition: all .18s;
        background: ${LGRAY};
      }
      .drag-zone:hover, .drag-zone.over {
        border-color: ${BLUE}; background: rgba(0,102,255,.04);
        box-shadow: 0 0 0 3px rgba(0,102,255,.07);
      }

      /* ── FORM ────────────────────────── */
      .form-label {
        display: block; font-size: 11.5px; font-weight: 600; color: ${GRAY};
        margin-bottom: 5px; letter-spacing: .2px;
      }
      .data-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 9px 0; border-bottom: 1px solid rgba(226,232,240,.8);
      }
      .data-row:last-child { border-bottom: none; }
      .data-row-label { font-size: 12.5px; color: ${GRAY}; }
      .data-row-value { font-size: 13px; color: ${DARK}; font-weight: 500; text-align: left; max-width: 260px; word-break: break-word; }

      /* ── SECTION HEADER ──────────────── */
      .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid ${BORDER}; }
      .section-title { font-size: 14.5px; font-weight: 700; color: ${DARK}; letter-spacing: -.2px; }

      /* ── NOTES ───────────────────────── */
      .note-item {
        display: flex; gap: 13px; padding: 13px 15px;
        background: ${LGRAY}; border: 1px solid ${BORDER};
        border-radius: 12px; margin-bottom: 8px; transition: all .14s;
      }
      .note-item:hover { background: #EEF5FF; border-color: rgba(0,102,255,.15); }

      /* ── PRIORITY BADGES ─────────────── */
      .priority-urgent { background: #FEF2F2; color: #DC2626; }
      .priority-high    { background: #FFF7ED; color: #C2410C; }
      .priority-normal  { background: #ECFDF5; color: #059669; }
      .priority-low     { background: ${LGRAY}; color: ${GRAY}; }

      /* ── WORKER DETAIL PANEL ─────────── */
      .worker-detail-pane {
        display: flex; height: calc(100vh - 54px); overflow: hidden;
      }
      .worker-detail-left {
        width: 280px; flex-shrink: 0; background: ${WHITE};
        border-left: 1px solid ${BORDER}; overflow-y: auto;
        display: flex; flex-direction: column;
      }
      .worker-detail-right {
        flex: 1; overflow-y: auto; background: ${CREAM};
      }
      .worker-avatar-ring {
        width: 72px; height: 72px; border-radius: 20px;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 900; color: ${WHITE};
        background: linear-gradient(135deg, ${BLUE} 0%, #004FCC 100%);
        box-shadow: 0 8px 24px rgba(0,102,255,.3);
      }

      /* ── ANIMATIONS ──────────────────── */
      @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
      @keyframes fadeInUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideIn   { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
      @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:.45; } }
      .fade-in   { animation: fadeIn   .2s  ease both; }
      .anim-up   { animation: fadeInUp .25s ease both; }
      .anim-slide { animation: slideIn .22s ease both; }
      .pulse     { animation: pulse 1.8s ease infinite; }
    `
    document.head.appendChild(s)
  }, [])
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = STATUSES.find(x => x.v === status) || STATUSES[0]
  return <span className="badge" style={{ background: s.bg, color: s.fg }}>{s.he}</span>
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 13, borderBottom: '1.5px solid ' + BORDER }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: DARK, letterSpacing: '-.3px' }}>{children}</div>
      {action}
    </div>
  )
}

function Inp({ label, value, onChange, type = 'text', placeholder, disabled, rows }) {
  return (
    <div style={{ marginBottom: 13 }}>
      {label && <label className="form-label">{label}</label>}
      {rows
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder || ''} className="v2-input" />
        : <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} disabled={disabled} className="v2-input" style={disabled ? { opacity: .45 } : {}} />
      }
    </div>
  )
}

function Sel({ label, value, onChange, opts, placeholder, disabled }) {
  return (
    <div style={{ marginBottom: 13 }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} className="v2-input v2-select" style={{ paddingLeft: 32, paddingRight: 13 }}>
          <option value=''>{placeholder || '—'}</option>
          {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
        </select>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: GRAY2, fontSize: 9 }}>▼</span>
      </div>
    </div>
  )
}

function NotesWidget({ notes, loading, onAdd, onDelete, currentUser }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  return (
    <div>
      <div style={{ background: CREAM, border: '1px solid ' + BORDER, borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, marginBottom: 10 }}>
          <Inp label="תאריך" type="date" value={date} onChange={setDate} />
          <Inp label="תרשומת" value={text} onChange={setText} placeholder="הוסף תרשומת..." />
        </div>
        <button className="v2-btn v2-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10, borderRadius: 9 }}
          onClick={async () => { if (!text.trim()) return; await onAdd({ text: text.trim(), note_date: date, created_by: currentUser }); setText(''); setDate(new Date().toISOString().split('T')[0]) }}>
          + הוסף תרשומת
        </button>
      </div>
      {loading ? <div style={{ textAlign: 'center', color: GRAY, padding: 24 }}>טוען...</div>
        : notes.length === 0 ? <div style={{ textAlign: 'center', color: '#D1D5DB', padding: 24, fontSize: 13 }}>אין תרשומות עדיין</div>
          : notes.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: LGRAY, borderRadius: 11, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, background: WHITE, border: '1.5px solid ' + BORDER, borderRadius: 9, padding: '6px 10px', textAlign: 'center', minWidth: 66 }}>
                <div style={{ fontSize: 11, color: GRAY }}>{new Date(n.note_date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{new Date(n.note_date).getFullYear()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: DARK, lineHeight: 1.7, direction: 'rtl' }}>{n.text}</div>
                {n.created_by && <div style={{ fontSize: 11, color: GRAY, marginTop: 3 }}>👤 {n.created_by}</div>}
              </div>
              <button onClick={() => onDelete(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 15, padding: '2px 4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>✕</button>
            </div>
          ))}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ candidates, tasks, apartments, onNavigate, currentUser }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const hour = now.getHours()
  const greeting = hour < 12 ? 'בוקר טוב,' : hour < 15 ? 'צהריים טובים,' : hour < 19 ? 'אחר הצהריים טובים,' : 'ערב טוב,'
  const WORKER_STATUSES = ['active', 'in_treatment', 'placed']
  const workers = candidates.filter(c => c.placement || WORKER_STATUSES.includes(c.status))
  const newApplicants = candidates.filter(c => !c.placement && !WORKER_STATUSES.includes(c.status))
  const expiringVisa = candidates.filter(c => isSoon(c.permit_expiry))
  const expiredVisa = candidates.filter(c => isExpired(c.permit_expiry))
  const openTasks = tasks.filter(t => t.status === 'open')
  const urgentTasks = tasks.filter(t => t.status === 'open' && t.priority === 'urgent')
  const placed = candidates.filter(c => c.placement)
  const recent = [...candidates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  const StatCard = ({ icon, label, value, sub, color, onClick }) => (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: (color || BLUE) + '08', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: (color || BLUE) + '12', border: '1px solid ' + (color || BLUE) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        {sub && <span className="badge" style={{ background: (color||BLUE)+'12', color: color||BLUE, fontSize: 10 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 38, fontWeight: 900, color: color || DARK, letterSpacing: '-2px', lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12, color: GRAY2, fontWeight: 500, letterSpacing: '-.1px' }}>{label}</div>
      {onClick && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, ' + color||BLUE + ', transparent)', opacity: .3 }} />}
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1120 }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: '-0.8px', lineHeight: 1.1 }}>שלום, {currentUser} 👋</h2>
            <p style={{ fontSize: 13, color: GRAY, marginTop: 5, fontWeight: 400 }}>{now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '10px 16px', textAlign: 'center', boxShadow: SHADOW_XS }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: DARK, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: 10.5, color: GRAY2, marginTop: 1 }}>שעה מקומית</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="👥" label="עובדים פעילים" value={workers.length} color={BLUE} onClick={() => onNavigate('workers')} />
        <StatCard icon="🎯" label="מועמדים חדשים" value={newApplicants.length} sub={newApplicants.length > 0 ? 'ממתינים' : null} color="#7C3AED" onClick={() => onNavigate('applicants')} />
        <StatCard icon="🏢" label="משובצים" value={placed.length} color="#059669" onClick={() => onNavigate('workers')} />
        <StatCard icon="🏠" label="דירות" value={apartments.length} color="#D97706" onClick={() => onNavigate('apartments')} />
        <StatCard icon="✅" label="משימות פתוחות" value={openTasks.length} sub={urgentTasks.length > 0 ? urgentTasks.length + ' דחופות' : null} color={urgentTasks.length > 0 ? '#DC2626' : DARK} onClick={() => onNavigate('tasks')} />
      </div>

      {/* Alerts */}
      {(expiredVisa.length > 0 || expiringVisa.length > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {expiredVisa.length > 0 && (
            <div onClick={() => onNavigate('workers')} style={{ flex: 1, minWidth: 220, background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 12, padding: '13px 16px', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#BE123C', marginBottom: 4 }}>🔴 ויזות פגות — {expiredVisa.length} עובדים</div>
              <div style={{ fontSize: 12, color: '#9F1239' }}>{expiredVisa.slice(0, 3).map(c => c.full_name_he || c.full_name_en).join(' · ')}</div>
            </div>
          )}
          {expiringVisa.length > 0 && (
            <div onClick={() => onNavigate('workers')} style={{ flex: 1, minWidth: 220, background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '13px 16px', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309', marginBottom: 4 }}>🟡 ויזות קרובות לפוג — {expiringVisa.length} עובדים</div>
              <div style={{ fontSize: 12, color: '#92400E' }}>{expiringVisa.slice(0, 3).map(c => c.full_name_he || c.full_name_en).join(' · ')}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Recent candidates */}
        <div className="v2-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>🆕 הרשמות אחרונות</div>
            <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onNavigate('applicants')}>הכל</button>
          </div>
          {recent.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{c.full_name_he || c.full_name_en || '—'}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{SECTORS.find(s => s.v === c.sector)?.he || '—'} · {fmtDate(c.created_at)}</div>
              </div>
              <Badge status={c.status} />
            </div>
          ))}
        </div>

        {/* Open tasks */}
        <div className="v2-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>✅ משימות פתוחות</div>
            <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onNavigate('tasks')}>הכל</button>
          </div>
          {openTasks.length === 0
            ? <div style={{ textAlign: 'center', padding: 30, color: GRAY, fontSize: 13 }}>אין משימות פתוחות 🎉</div>
            : openTasks.slice(0, 6).map(t => {
              const over = t.due_date && new Date(t.due_date) < now
              return (
                <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.priority === 'urgent' ? '#DC2626' : t.priority === 'high' ? '#D97706' : BLUE, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: GRAY }}>
                      {t.assigned_to && '👤 ' + t.assigned_to}
                      {t.due_date && <span style={{ color: over ? '#DC2626' : GRAY, marginRight: 6 }}> · 📅 {fmtDate(t.due_date)}{over ? ' ⚠️' : ''}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// ─── APPLICANTS (מועמדים לעבודה) ──────────────────────────────────────────────
function ApplicantsModule({ candidates, onUpdate, onDelete, currentUser }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)

  useEffect(() => {
    if (selected && tab === 'notes') {
      setNotesLoading(true)
      fetchNotes(selected.id).then(d => { setNotes(d); setNotesLoading(false) }).catch(() => setNotesLoading(false))
    }
  }, [selected, tab])

  // Applicants = candidates without placement and not yet active workers
  const WORKER_STATUSES = ['active', 'in_treatment', 'placed']
  const allApplicants = candidates.filter(c => !c.placement && !WORKER_STATUSES.includes(c.status))

  const filtered = allApplicants.filter(c => {
    const q = search.toLowerCase()
    return (!q || [c.full_name_he, c.full_name_en, c.phone, c.sector].some(v => (v || '').toLowerCase().includes(q)))
      && (!filterStatus || c.status === filterStatus)
      && (!filterSector || c.sector === filterSector)
  })

  const APPLICANT_STATUSES = [
    { v: 'new', label: '🆕 חדש', bg: '#EEF2FF', fg: '#4F46E5' },
    { v: 'contacted', label: '📞 נוצר קשר', bg: '#F0FDF4', fg: '#059669' },
    { v: 'interview', label: '🤝 ראיון', bg: '#FFFBEB', fg: '#D97706' },
    { v: 'placed', label: '✅ שובץ', bg: '#F0FDF9', fg: '#0F766E' },
    { v: 'rejected', label: '❌ לא מתאים', bg: '#FFF1F2', fg: '#BE123C' },
    { v: 'waitlist', label: '⏳ רשימת המתנה', bg: '#F5F5F7', fg: '#6E6E73' },
  ]

  const setApplicantStatus = async (id, status) => {
    await onUpdate(id, { status })
    if (selected?.id === id) setSelected(s => ({ ...s, status }))
  }

  if (selected) {
    const name = selected.full_name_he || selected.full_name_en || '—'
    const astatus = APPLICANT_STATUSES.find(s => s.v === selected.status) || APPLICANT_STATUSES[0]
    const appInitials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    return (
      <div className="fade-in" style={{ background: CREAM, minHeight: 'calc(100vh - 54px)' }}>
        <div style={{ background: WHITE, borderBottom: '1px solid ' + BORDER, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, borderRadius: 8 }} onClick={() => setSelected(null)}>← חזרה</button>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{appInitials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: DARK, letterSpacing: '-.3px' }}>{name}</div>
            {selected.full_name_en && selected.full_name_he && <div style={{ fontSize: 11.5, color: GRAY, marginTop: 1 }}>{selected.full_name_en}</div>}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ background: astatus.bg, color: astatus.fg }}>{astatus.label}</span>
            {selected.phone && (
              <a href={'https://wa.me/' + selected.phone.replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none', padding: '7px 13px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, color: '#15803D', fontSize: 13, fontWeight: 700, fontFamily: F }}>
                💬 WA
              </a>
            )}
          </div>
        </div>

        {/* Status changer */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          {APPLICANT_STATUSES.map(s => (
            <button key={s.v} onClick={() => setApplicantStatus(selected.id, s.v)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid ' + selected.status === s.v ? s.fg : BORDER, background: selected.status === s.v ? s.bg : WHITE, color: selected.status === s.v ? s.fg : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              {s.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={async () => {
              const employer = window.prompt('שם המעסיק / מקום עבודה:')
              if (!employer) return
              await onUpdate(selected.id, { placement: employer, placement_date: new Date().toISOString().split('T')[0], status: 'active' })
              setSelected(s => ({ ...s, placement: employer, status: 'active' }))
              alert('✅ ' + selected.full_name_he || selected.full_name_en + ' שובץ אצל ' + employer + ' והועבר למודול עובדים')
              setSelected(null)
            }}
            style={{ padding: '8px 16px', background: '#0F766E', color: WHITE, border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', gap: 6 }}>
            👷 שבץ → העבר לעובדים
          </button>
        </div>

        <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto', marginTop: 14 }}>
          {[['info', '📋 פרטים'], ['notes', '📝 מעקב ותרשומות']].map(([k, l]) => (
            <button key={k} className={'tab-btn' + tab === k ? ' active' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ maxWidth: 700, margin: '24px auto', padding: '0 20px 60px' }}>
          {tab === 'info' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>פרטי המועמד</SectionTitle>
              {[['📱', 'טלפון', selected.phone], ['📧', 'אימייל', selected.email], ['🌍', 'מדינה', selected.country], ['📍', 'עיר', selected.city], ['🎂', 'ת.לידה', selected.dob ? fmtDate(selected.dob) : null], ['⚙️', 'ענף', SECTORS.find(s => s.v === selected.sector)?.he], ['🔧', 'מקצוע', selected.profession], ['📅', 'ניסיון', selected.experience ? selected.experience + ' שנים' : null], ['🏢', 'מעסיק נוכחי', selected.current_employer], ['🪪', 'ויזה', PERMITS.find(p => p.v === selected.permit_type)?.l], ['✈️', 'כניסה', selected.entry_date ? fmtDate(selected.entry_date) : null]].map(([icon, label, val]) => val ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ fontSize: 12, color: GRAY }}>{icon} {label}</span>
                  <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{val}</span>
                </div>
              ) : null)}
              <div style={{ marginTop: 10, fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>נרשם {fmtDate(selected.created_at)}</div>
            </div>
          )}
          {tab === 'notes' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📝 מעקב ותרשומות</SectionTitle>
              <NotesWidget notes={notes} loading={notesLoading} currentUser={currentUser}
                onAdd={async (fields) => { const n = await insertNote({ candidate_id: selected.id, ...fields }); setNotes(p => [n, ...p]) }}
                onDelete={async (id) => { await deleteNote(id); setNotes(p => p.filter(n => n.id !== id)) }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>🎯 מועמדים ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 9 }}>
          <input placeholder="🔍 חיפוש שם, טלפון..." value={search} onChange={e => setSearch(e.target.value)}
            className="v2-input" style={{ minWidth: 200, fontSize: 13 }} />
          <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="v2-input v2-select" style={{ fontSize: 13, minWidth: 110, paddingLeft: 28 }}>
            <option value=''>כל הענפים</option>
            {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
        </div>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterStatus('')}
          style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid ' + !filterStatus ? BLUE : BORDER, background: !filterStatus ? BLUE + '18' : WHITE, color: !filterStatus ? BLUE : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
          הכל ({candidates.length})
        </button>
        {APPLICANT_STATUSES.map(s => {
          const cnt = candidates.filter(c => c.status === s.v).length
          if (!cnt) return null
          return (
            <button key={s.v} onClick={() => setFilterStatus(s.v)}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid ' + filterStatus === s.v ? s.fg : BORDER, background: filterStatus === s.v ? s.bg : WHITE, color: filterStatus === s.v ? s.fg : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              {s.label} ({cnt})
            </button>
          )
        })}
      </div>

      <div className="v2-card" style={{ overflow: 'hidden' }}>
        <table className="v2-table">
          <thead><tr><th>שם</th><th>טלפון</th><th>ענף / מקצוע</th><th>ויזה</th><th>סטטוס</th><th>נרשם</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 50, color: '#D1D5DB' }}>אין מועמדים תואמים</td></tr>}
            {filtered.map(c => {
              const as = APPLICANT_STATUSES.find(s => s.v === c.status)
              return (
                <tr key={c.id} className="candidate-row" onClick={() => { setSelected(c); setTab('info') }}>
                  <td style={{ fontWeight: 700, color: DARK }}>{c.full_name_he || c.full_name_en || '—'}</td>
                  <td style={{ color: GRAY, direction: 'ltr' }}>{c.phone || '—'}</td>
                  <td style={{ color: GRAY, fontSize: 12 }}>{SECTORS.find(s => s.v === c.sector)?.he || '—'} {c.profession && '· ' + c.profession.split('/')[0]}</td>
                  <td style={{ fontSize: 12, color: GRAY }}>{PERMITS.find(p => p.v === c.permit_type)?.l || '—'}</td>
                  <td>{as && <span className="badge" style={{ background: as.bg, color: as.fg }}>{as.label}</span>}</td>
                  <td style={{ color: GRAY, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                  <td style={{ textAlign: 'center', width: 48 }}>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('למחוק את ' + c.full_name_he || c.full_name_en + '?')) onDelete(c.id) }}
                      style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: '#BE123C', fontSize: 13, fontFamily: 'inherit' }}>
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
  )
}


// ─── APARTMENT LINK WIDGET ───────────────────────────────────────────────────
function ApartmentLink({ candidateId, currentApartmentId, onUpdate }) {
  const [apts, setApts] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('apartments').select('id,address,city').eq('status','active').order('address')
      .then(({ data }) => {
        setApts(data || [])
        if (currentApartmentId) setCurrent((data||[]).find(a => a.id === currentApartmentId) || null)
        setLoading(false)
      })
  }, [currentApartmentId])

  const assign = async (aptId) => {
    setSaving(true)
    if (currentApartmentId) {
      await supabase.from('apartment_residents').delete()
        .eq('apartment_id', currentApartmentId).eq('candidate_id', candidateId)
    }
    if (aptId) {
      await supabase.from('apartment_residents').upsert([{
        apartment_id: aptId, candidate_id: candidateId,
        move_in_date: new Date().toISOString().split('T')[0]
      }])
    }
    const apt = apts.find(a => a.id === aptId)
    setCurrent(apt || null)
    onUpdate(aptId || null)
    setSaving(false)
  }

  if (loading) return <div style={{ color: GRAY, fontSize: 13 }}>טוען...</div>

  return (
    <div>
      {current ? (
        <div style={{ background: '#F0FDF9', border: '1.5px solid #CCFBF1', borderRadius: 12, padding: '13px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>דירה נוכחית</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{current.address}</div>
          {current.city && <div style={{ fontSize: 12, color: GRAY }}>📍 {current.city}</div>}
        </div>
      ) : (
        <div style={{ background: LGRAY, borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: GRAY }}>לא משויך לדירה</div>
      )}
      <div style={{ position: 'relative' }}>
        <select value={currentApartmentId || ''} onChange={e => assign(e.target.value || null)}
          className="v2-input v2-select" style={{ paddingLeft: 32, fontSize: 13 }} disabled={saving}>
          <option value=''>— ללא שיבוץ לדירה —</option>
          {apts.map(a => <option key={a.id} value={a.id}>{a.address}{a.city ? ', ' + a.city : ''}</option>)}
        </select>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: GRAY, fontSize: 10 }}>▼</span>
        {saving && <span style={{ fontSize: 11, color: GRAY, marginTop: 4, display: 'block' }}>שומר...</span>}
      </div>
    </div>
  )
}

// ─── WORKERS MODULE ───────────────────────────────────────────────────────────
function WorkersModule({ candidates, onUpdate, onDelete, currentUser }) {
  const [search, setSearch] = useState('')
  const [filterSector, setSector] = useState('')
  const [filterStatus, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const fileRefs = useRef({})

  useEffect(() => {
    if (selected && tab === 'notes') {
      setNotesLoading(true)
      fetchNotes(selected.id).then(d => { setNotes(d); setNotesLoading(false) }).catch(() => setNotesLoading(false))
    }
  }, [selected, tab])

  // Workers = candidates who have a placement OR status is active/in-treatment
  const WORKER_STATUSES = ['active', 'in_treatment', 'placed']
  const allWorkers = candidates.filter(c => c.placement || WORKER_STATUSES.includes(c.status))

  const filtered = allWorkers.filter(c => {
    const q = search.toLowerCase()
    return (!q || [c.full_name_he, c.full_name_en, c.phone, c.permit_number, c.placement].some(v => (v || '').toLowerCase().includes(q)))
      && (!filterSector || c.sector === filterSector)
      && (!filterStatus || c.status === filterStatus)
  })

  if (selected) {
    const name = selected.full_name_he || selected.full_name_en || '—'
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const save = async () => {
      setSaving(true)
      await onUpdate(selected.id, form)
      setSelected(s => ({ ...s, ...form }))
      setSaving(false); setEditMode(false)
    }

    const INP_S = { padding: '10px 13px', background: LGRAY, border: '1.5px solid ' + BORDER, borderRadius: 10, color: DARK, fontFamily: F, fontSize: 13, outline: 'none', width: '100%' }

    return (
      <div className="fade-in" style={{ background: CREAM, minHeight: 'calc(100vh - 54px)' }}>
        <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8 }} onClick={() => { setSelected(null); setEditMode(false) }}>← חזרה</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: DARK }}>{name}</div>
            {selected.full_name_en && selected.full_name_he && <div style={{ fontSize: 12, color: GRAY }}>{selected.full_name_en}</div>}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge status={form.status || selected.status} />
            {selected.phone && <>
              <a href={'tel:' + selected.phone} className="v2-btn v2-btn-ghost" style={{ textDecoration: 'none', fontSize: 13, padding: '7px 13px' }}>📞</a>
              <a href={'https://wa.me/' + selected.phone.replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer" className="v2-btn v2-btn-ghost" style={{ textDecoration: 'none', fontSize: 13, padding: '7px 13px' }}>💬 WA</a>
            </>}
            <button className="v2-btn v2-btn-danger" style={{ fontSize: 13, padding: '8px 14px' }}
              onClick={() => { if (window.confirm('⚠️ מחיקת עובד\n\nהאם למחוק את ' + name + '?\nכל הנתונים, תרשומות ומסמכים יימחקו.\nפעולה זו אינה הפיכה.')) { onDelete(selected.id); setSelected(null) } }}>
              🗑️ מחק עובד
            </button>
          </div>
        </div>

        {/* Status quick change */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {WORKER_STATUS_LIST.map(s => (
            <button key={s.v} onClick={async () => {
              if (s.v === 'inactive') { setShowInactiveModal(true); return }
              const updates = { status: s.v }
              if (s.v === 'escaped' && !selected.escaped_at) updates.escaped_at = new Date().toISOString().split('T')[0]
              if (s.v === 'injured' && !selected.injured_at) updates.injured_at = new Date().toISOString().split('T')[0]
              set('status', s.v)
              await onUpdate(selected.id, updates)
              setSelected(c => ({ ...c, ...updates }))
            }}
              style={{ padding: '5px 13px', borderRadius: 20, border: '1.5px solid ' + (form.status || selected.status) === s.v ? s.fg : BORDER, background: (form.status || selected.status) === s.v ? s.bg : WHITE, color: (form.status || selected.status) === s.v ? s.fg : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              {s.he}
            </button>
          ))}
        </div>

        {showInactiveModal && (
        <InactiveModal candidate={selected}
          onSave={async (updates) => { await onUpdate(selected.id, updates); setSelected(s => ({ ...s, ...updates })) }}
          onClose={() => setShowInactiveModal(false)} />
      )}

      <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto', marginTop: 12 }}>
          {[['info', '📋 פרטים'], ['placement', '🏢 שיבוץ'], ['finances', '💰 פיננסים'], ['events', '📅 אירועים'], ['docs', '📁 מסמכים'], ['notes', '📝 תרשומות']].map(([k, l]) => (
            <button key={k} className={'tab-btn' + tab === k ? ' active' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ maxWidth: 700, margin: '22px auto', padding: '0 20px 60px' }}>
          {tab === 'info' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle action={
                <button className={'v2-btn ' + editMode ? 'v2-btn-primary' : 'v2-btn-ghost'} style={{ fontSize: 13 }}
                  onClick={() => { if (editMode) { save() } else { setForm({ ...selected }); setEditMode(true) } }}>
                  {saving ? 'שומר...' : editMode ? '💾 שמור' : '✏️ ערוך'}
                </button>
              }>פרטים אישיים ומקצועיים</SectionTitle>
              {editMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['שם עברית', 'full_name_he'], ['שם אנגלית', 'full_name_en'], ['טלפון', 'phone'], ['אימייל', 'email'], ['מדינה', 'country'], ['עיר', 'city'], ['ענף', 'sector'], ['מקצוע', 'profession'], ['ניסיון', 'experience'], ['מעסיק נוכחי', 'current_employer'], ['מעסיק אחרון', 'last_employer'], ['מספר היתר', 'permit_number']].map(([label, k]) => (
                    <div key={k}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>{label}</label><input value={form[k] || ''} onChange={e => set(k, e.target.value)} style={INP_S} /></div>
                  ))}
                  {[['תוקף ויזה', 'permit_expiry'], ['כניסה לישראל', 'entry_date'], ['ת.לידה', 'dob'], ['תחילת עבודה בפועל', 'work_start_date'], ['תאריך בריחה', 'escaped_at'], ['תאריך פציעה', 'injured_at']].map(([label, k]) => (
                    <div key={k}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>{label}</label><input type="date" value={form[k] || ''} onChange={e => set(k, e.target.value)} style={INP_S} /></div>
                  ))}
                </div>
              ) : (
                <div>
                  {[['📱', 'טלפון', selected.phone], ['📧', 'אימייל', selected.email], ['🌍', 'מדינה', selected.country?.split('/')[0]?.trim()], ['📍', 'עיר', selected.city?.split('/')[0]?.trim()], ['🎂', 'ת.לידה', selected.dob ? fmtDate(selected.dob) : null], ['⚙️', 'ענף', SECTORS.find(s => s.v === selected.sector)?.he], ['🔧', 'מקצוע', selected.profession?.split('/')[0]?.trim()], ['📅', 'ניסיון', selected.experience ? selected.experience + ' שנים' : null], ['🏢', 'מעסיק נוכחי', selected.current_employer], ['🏛️', 'מעסיק אחרון', selected.last_employer], ['🪪', 'ויזה', PERMITS.find(p => p.v === selected.permit_type)?.l], ['🔢', 'מספר היתר', selected.permit_number], ['✈️', 'כניסה לישראל', selected.entry_date ? fmtDate(selected.entry_date) : null]].map(([icon, label, val]) => val ? (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{icon} {label}</span>
                      <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{val}</span>
                    </div>
                  ) : null)}
                  {selected.permit_expiry && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>⏱ תוקף ויזה</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isExpired(selected.permit_expiry) ? '#DC2626' : isSoon(selected.permit_expiry) ? '#D97706' : DARK }}>
                        {fmtDate(selected.permit_expiry)} {isExpired(selected.permit_expiry) ? '🔴' : isSoon(selected.permit_expiry) ? '🟡' : ''}
                      </span>
                    </div>
                  )}
                  <div style={{ marginTop: 10, fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>נרשם {fmtDate(selected.created_at)} · #{selected.id.slice(0, 8)}</div>
                </div>
              )}
            </div>
          )}

          {tab === 'placement' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>🏢 שיבוץ</SectionTitle>
              {selected.placement && (
                <div style={{ background: '#F0FDF9', border: '1.5px solid #CCFBF1', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' }}>שיבוץ נוכחי</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.placement}</div>
                  {selected.placement_date && <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>מתאריך: {fmtDate(selected.placement_date)}</div>}
                </div>
              )}
              {!editMode && <button className="v2-btn v2-btn-ghost" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => { setForm({ ...selected }); setEditMode(true) }}>✏️ ערוך שיבוץ</button>}
              {editMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Inp label="מקום עבודה" value={form.placement} onChange={v => set('placement', v)} />
                  <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 5 }}>תאריך שיבוץ</label><input type="date" value={form.placement_date || ''} onChange={e => set('placement_date', e.target.value)} className="v2-input" /></div>
                  <Inp label="הערות" value={form.placement_notes} onChange={v => set('placement_notes', v)} rows={3} />
                  <button className="v2-btn v2-btn-primary" onClick={async () => {
                    setSaving(true)
                    const updates = { placement: form.placement, placement_date: form.placement_date || null, placement_notes: form.placement_notes }
                    // Auto-promote to worker when placement assigned
                    if (form.placement && !['active','in_treatment'].includes(selected.status)) {
                      updates.status = 'active'
                    }
                    await onUpdate(selected.id, updates)
                    setSelected(s => ({ ...s, ...updates }))
                    setSaving(false); setEditMode(false)
                    if (updates.status === 'active') alert('✅ העובד שובץ והועבר אוטומטית למודול עובדים')
                  }}>
                    {saving ? 'שומר...' : '💾 שמור שיבוץ'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'docs' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📁 מסמכים</SectionTitle>
              {DOC_FIELDS.map(d => {
                const hasDoc = selected['doc_' + d.k]
                return (
                  <div key={d.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', marginBottom: 8, background: LGRAY, borderRadius: 10 }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{d.he}</div><div style={{ fontSize: 11, color: GRAY }}>{d.en}</div></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasDoc ? <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={async () => { const url = await getDocUrl(selected.id, d.k); if (url) window.open(url, '_blank') }}>👁 צפה</button>
                        : <span style={{ fontSize: 11, color: '#D1D5DB' }}>לא הועלה</span>}
                      <button className="v2-btn v2-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => fileRefs.current[d.k]?.click()}>
                        {hasDoc ? '🔄 החלף' : '📎 העלה'}
                      </button>
                      <input ref={el => fileRefs.current[d.k] = el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                        onChange={async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; await uploadDoc(selected.id, d.k, f); await onUpdate(selected.id, { ['doc_' + d.k]: true }); setSelected(s => ({ ...s, ['doc_' + d.k]: true })) }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}


          {tab === 'finances' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle action={
                editMode
                  ? <button className="v2-btn v2-btn-primary" style={{ fontSize: 13 }} onClick={save}>{saving ? 'שומר...' : '💾 שמור'}</button>
                  : <button className="v2-btn v2-btn-ghost" style={{ fontSize: 13 }} onClick={() => { setForm({ ...selected }); setEditMode(true) }}>✏️ ערוך</button>
              }>💰 פרטים פיננסיים</SectionTitle>

              {/* Bank account */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 12 }}>🏦 חשבון בנק</div>
                {editMode ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Inp label="שם הבנק" value={form.bank_name} onChange={v => set('bank_name', v)} />
                    <Inp label="מספר סניף" value={form.bank_branch} onChange={v => set('bank_branch', v)} />
                    <Inp label="מספר חשבון" value={form.bank_account} onChange={v => set('bank_account', v)} />
                    <Inp label="שם בעל החשבון" value={form.bank_holder_name} onChange={v => set('bank_holder_name', v)} />
                  </div>
                ) : (
                  <div>
                    {[['🏦', 'שם הבנק', selected.bank_name], ['🔢', 'מספר סניף', selected.bank_branch], ['💳', 'מספר חשבון', selected.bank_account], ['👤', 'שם בעל החשבון', selected.bank_holder_name]].map(([icon, label, val]) => val ? (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                        <span style={{ fontSize: 12, color: GRAY }}>{icon} {label}</span>
                        <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{val}</span>
                      </div>
                    ) : null)}
                    {!selected.bank_name && !selected.bank_account && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#D1D5DB', fontSize: 13 }}>לא הוזנו פרטי בנק</div>
                    )}
                  </div>
                )}
              </div>

              {/* Deposit */}
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 12 }}>🔒 חשבון פקדון</div>
                {editMode ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Inp label="סכום פקדון (₪)" value={form.deposit_amount} onChange={v => set('deposit_amount', v)} type="number" />
                    <div style={{ gridColumn: '1/-1' }}><Inp label="הערות פקדון" value={form.deposit_notes} onChange={v => set('deposit_notes', v)} rows={2} /></div>
                  </div>
                ) : (
                  <div>
                    {selected.deposit_amount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                        <span style={{ fontSize: 12, color: '#92400E' }}>💰 סכום</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#92400E' }}>₪{Number(selected.deposit_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {selected.deposit_notes && (
                      <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, marginTop: 8 }}>{selected.deposit_notes}</div>
                    )}
                    {!selected.deposit_amount && !selected.deposit_notes && (
                      <div style={{ textAlign: 'center', color: '#D97706', fontSize: 13 }}>לא הוזן פקדון</div>
                    )}
                  </div>
                )}
              </div>

              {/* Housing assignment */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 12 }}>🏠 שיבוץ למגורים</div>
                <ApartmentLink candidateId={selected.id} currentApartmentId={selected.apartment_id} onUpdate={(aptId, aptName) => { onUpdate(selected.id, { apartment_id: aptId }); setSelected(s => ({ ...s, apartment_id: aptId })) }} />
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📅 ציר זמן אירועים</SectionTitle>
              <EventsTab candidateId={selected.id} currentUser={currentUser} />
            </div>
          )}

          {tab === 'notes' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📝 תרשומות ומעקב</SectionTitle>
              <NotesWidget notes={notes} loading={notesLoading} currentUser={currentUser}
                onAdd={async (fields) => { const n = await insertNote({ candidate_id: selected.id, ...fields }); setNotes(p => [n, ...p]) }}
                onDelete={async (id) => { await deleteNote(id); setNotes(p => p.filter(n => n.id !== id)) }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: DARK, letterSpacing: '-0.5px', lineHeight: 1 }}>עובדים</h3>
          <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{filtered.length} רשומות</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input placeholder="חיפוש שם / טלפון / שיבוץ..." value={search} onChange={e => setSearch(e.target.value)}
              className="v2-input" style={{ minWidth: 240, fontSize: 13, paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: GRAY2, fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          </div>
          <select value={filterSector} onChange={e => setSector(e.target.value)} className="v2-input v2-select" style={{ fontSize: 13, minWidth: 120, paddingLeft: 28 }}>
            <option value=''>כל הענפים</option>
            {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setStatus(e.target.value)} className="v2-input v2-select" style={{ fontSize: 13, minWidth: 110, paddingLeft: 28 }}>
            <option value=''>כל הסטטוסים</option>
            {WORKER_STATUS_LIST.map(s => <option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
        {WORKER_STATUS_LIST.map(s => {
          const cnt = allWorkers.filter(c => c.status === s.v).length
          if (!cnt && filterStatus !== s.v) return null
          const active = filterStatus === s.v
          return (
            <div key={s.v} onClick={() => setStatus(active ? '' : s.v)}
              style={{ minWidth: 80, background: active ? s.bg : WHITE, border: '1.5px solid ' + active ? s.fg : BORDER, borderRadius: 10, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s', boxShadow: active ? SHADOW_SM : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: active ? s.fg : DARK, letterSpacing: '-1px' }}>{cnt}</div>
              <div style={{ fontSize: 10, color: active ? s.fg : GRAY, fontWeight: 700, marginTop: 2 }}>{s.he.replace(/^[^\s]+ /, '')}</div>
            </div>
          )
        })}
      </div>

      <div className="v2-card" style={{ overflow: 'hidden' }}>
        <table className="v2-table">
          <thead><tr>
            <th>שם <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>טלפון</th>
            <th>מדינה <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>ענף <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>ויזה</th>
            <th>תוקף <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>שיבוץ <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>סטטוס <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th>נרשם <span style={{color:GRAY2,fontSize:9}}>↕</span></th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: '#D1D5DB' }}>אין עובדים תואמים</td></tr>}
            {filtered.map(c => {
              const exp = isExpired(c.permit_expiry); const soon = isSoon(c.permit_expiry)
              return (
                <tr key={c.id} className="candidate-row" onClick={() => { setSelected(c); setForm(c); setTab('info'); setEditMode(false) }}>
                  <td style={{ fontWeight: 700, color: DARK, whiteSpace: 'nowrap' }}>{c.full_name_he || c.full_name_en || '—'}</td>
                  <td style={{ color: GRAY, direction: 'ltr' }}>{c.phone || '—'}</td>
                  <td style={{ color: GRAY, fontSize: 12 }}>{(c.country || '—').split('/')[0].trim()}</td>
                  <td style={{ fontSize: 12 }}>{SECTORS.find(s => s.v === c.sector)?.he || '—'}</td>
                  <td style={{ color: GRAY, fontSize: 12 }}>{PERMITS.find(p => p.v === c.permit_type)?.l || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ color: exp ? '#DC2626' : soon ? '#D97706' : DARK, fontWeight: (exp || soon) ? 700 : 400, fontSize: 13 }}>
                      {c.permit_expiry ? fmtDate(c.permit_expiry) : '—'} {exp ? '🔴' : soon ? '🟡' : ''}
                    </span>
                  </td>
                  <td style={{ color: c.placement ? '#0F766E' : '#D1D5DB', fontWeight: c.placement ? 600 : 400, fontSize: 12 }}>{c.placement || '—'}</td>
                  <td>{(() => { const s = WORKER_STATUS_LIST.find(x=>x.v===c.status) || WORKER_STATUS_LIST[0]; return <span className="badge" style={{background:s.bg,color:s.fg}}>{s.he}</span> })()}</td>
                  <td style={{ color: GRAY, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center', width: 48 }}>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('למחוק את ' + c.full_name_he || c.full_name_en + '?\nפעולה זו אינה הפיכה.')) onDelete(c.id) }}
                      style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: '#BE123C', fontSize: 13, fontFamily: 'inherit' }}>
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
  )
}

// ─── APARTMENTS MODULE ────────────────────────────────────────────────────────
function ApartmentsModule({ candidates, currentUser }) {
  const [apts, setApts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editApt, setEditApt] = useState(null)
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [residents, setResidents] = useState([])
  const [tab, setTab] = useState('info')

  const load = async () => {
    const { data } = await supabase.from('apartments').select('*').order('created_at', { ascending: false })
    setApts(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected) return
    if (tab === 'notes') {
      setNotesLoading(true)
      supabase.from('apartment_notes').select('*').eq('apartment_id', selected.id).order('note_date', { ascending: false })
        .then(({ data }) => { setNotes(data || []); setNotesLoading(false) })
    }
    if (tab === 'residents') {
      supabase.from('apartment_residents').select('*,candidates(full_name_he,full_name_en,phone,sector)').eq('apartment_id', selected.id)
        .then(({ data }) => setResidents(data || []))
    }
  }, [selected, tab])

  const filtered = apts.filter(a => {
    const q = search.toLowerCase()
    return !q || [a.address, a.city, a.owner_name].some(v => (v || '').toLowerCase().includes(q))
  })

  const AptForm = ({ existing, onSave, onCancel }) => {
    const f = existing || {}
    const [lf, setLf] = useState({ address: f.address || '', city: f.city || '', floor: f.floor || '', rooms: f.rooms || '', owner_name: f.owner_name || '', owner_phone: f.owner_phone || '', rent_amount: f.rent_amount || '', start_date: f.start_date || '', end_date: f.end_date || '', meter_electric: f.meter_electric || '', meter_water: f.meter_water || '', meter_gas: f.meter_gas || '' })
    const sl = (k, v) => setLf(p => ({ ...p, [k]: v }))
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '22px 20px' }}>
        <div className="v2-card" style={{ padding: 22 }}>
          <SectionTitle action={<button className="v2-btn v2-btn-ghost" onClick={onCancel}>ביטול</button>}>{existing ? 'עריכת דירה' : 'דירה חדשה'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><Inp label="כתובת *" value={lf.address} onChange={v => sl('address', v)} /></div>
            <Inp label="עיר" value={lf.city} onChange={v => sl('city', v)} />
            <Inp label="קומה" value={lf.floor} onChange={v => sl('floor', v)} />
            <Inp label="מספר חדרים" value={lf.rooms} onChange={v => sl('rooms', v)} type="number" />
            <Inp label="שכ״ד (₪/חודש)" value={lf.rent_amount} onChange={v => sl('rent_amount', v)} type="number" />
            <Inp label="שם בעל דירה" value={lf.owner_name} onChange={v => sl('owner_name', v)} />
            <Inp label="טלפון בעל דירה" value={lf.owner_phone} onChange={v => sl('owner_phone', v)} />
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 5 }}>תחילת חוזה</label><input type="date" value={lf.start_date} onChange={e => sl('start_date', e.target.value)} className="v2-input" /></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 5 }}>סיום חוזה</label><input type="date" value={lf.end_date} onChange={e => sl('end_date', e.target.value)} className="v2-input" /></div>
            <Inp label="מונה חשמל" value={lf.meter_electric} onChange={v => sl('meter_electric', v)} />
            <Inp label="מונה מים" value={lf.meter_water} onChange={v => sl('meter_water', v)} />
            <Inp label="מונה גז" value={lf.meter_gas} onChange={v => sl('meter_gas', v)} />
          </div>
          <button className="v2-btn v2-btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => onSave(lf)}>
            {existing ? '💾 שמור' : '+ הוסף דירה'}
          </button>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <AptForm existing={editApt} onCancel={() => { setShowForm(false); setEditApt(null) }}
        onSave={async (lf) => {
          if (editApt) {
            await supabase.from('apartments').update(lf).eq('id', editApt.id)
            setApts(p => p.map(a => a.id === editApt.id ? { ...a, ...lf } : a))
            if (selected?.id === editApt.id) setSelected(s => ({ ...s, ...lf }))
          } else {
            const { data } = await supabase.from('apartments').insert([lf]).select().single()
            setApts(p => [data, ...p])
          }
          setShowForm(false); setEditApt(null)
        }} />
    )
  }

  if (selected) {
    return (
      <div className="fade-in" style={{ background: CREAM, minHeight: 'calc(100vh - 54px)' }}>
        <div style={{ background: WHITE, borderBottom: '1px solid ' + BORDER, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          <button className="v2-btn v2-btn-ghost" style={{ borderRadius: 8, fontSize: 12 }} onClick={() => setSelected(null)}>← חזרה</button>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #D97706, #B45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: DARK, letterSpacing: '-.3px' }}>{selected.address}</div>
            <div style={{ fontSize: 11.5, color: GRAY, marginTop: 1 }}>{selected.city} {selected.floor && '· קומה ' + selected.floor} {selected.rooms && '· ' + selected.rooms + ' חדרים'}</div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {selected.owner_phone && <a href={'tel:' + selected.owner_phone} className="v2-btn v2-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>📞 בעל דירה</a>}
            <button className="v2-btn v2-btn-ghost" onClick={() => { setEditApt(selected); setShowForm(true) }}>✏️ ערוך</button>
            <button className="v2-btn v2-btn-danger" style={{ fontSize: 12 }} onClick={async () => { if (window.confirm('למחוק?')) { await supabase.from('apartments').delete().eq('id', selected.id); setApts(p => p.filter(a => a.id !== selected.id)); setSelected(null) } }}>🗑️</button>
          </div>
        </div>
        <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
          {[['info', '📋 פרטים'], ['residents', '👥 דיירים'], ['notes', '📝 תרשומות']].map(([k, l]) => (
            <button key={k} className={'tab-btn' + tab === k ? ' active' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{ maxWidth: 700, margin: '22px auto', padding: '0 20px 60px' }}>
          {tab === 'info' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>פרטי הדירה</SectionTitle>
              {[['📍', 'כתובת', selected.address + selected.city ? ', ' + selected.city : ''], ['🏠', 'קומה', selected.floor], ['🛏', 'חדרים', selected.rooms], ['💰', 'שכ"ד', selected.rent_amount ? '₪' + selected.rent_amount + '/חודש' : null], ['👤', 'בעל דירה', selected.owner_name], ['📞', 'טלפון', selected.owner_phone], ['📅', 'תחילת חוזה', selected.start_date ? fmtDate(selected.start_date) : null], ['📅', 'סיום חוזה', selected.end_date ? fmtDate(selected.end_date) : null], ['⚡', 'מונה חשמל', selected.meter_electric], ['💧', 'מונה מים', selected.meter_water], ['🔥', 'מונה גז', selected.meter_gas]].map(([icon, label, val]) => val ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ fontSize: 12, color: GRAY }}>{icon} {label}</span>
                  <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{val}</span>
                </div>
              ) : null)}
            </div>
          )}
          {tab === 'residents' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle action={
                <select className="v2-input v2-select" style={{ minWidth: 180, fontSize: 13, paddingLeft: 28 }}
                  onChange={async e => {
                    if (!e.target.value) return
                    const { data } = await supabase.from('apartment_residents').insert([{ apartment_id: selected.id, candidate_id: e.target.value }]).select('*,candidates(full_name_he,full_name_en,phone,sector)').single()
                    setResidents(p => [...p, data]); e.target.value = ''
                  }}>
                  <option value=''>+ הוסף דייר</option>
                  {candidates.filter(c => !residents.find(r => r.candidate_id === c.id)).map(c => (
                    <option key={c.id} value={c.id}>{c.full_name_he || c.full_name_en}</option>
                  ))}
                </select>
              }>👥 דיירים ({residents.length})</SectionTitle>
              {residents.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#D1D5DB', fontSize: 13 }}>אין דיירים משויכים</div>
                : residents.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: LGRAY, borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.candidates?.full_name_he || r.candidates?.full_name_en}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{r.candidates?.phone}</div>
                    </div>
                    <button onClick={async () => { await supabase.from('apartment_residents').delete().eq('id', r.id); setResidents(p => p.filter(x => x.id !== r.id)) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 14 }}>✕</button>
                  </div>
                ))}
            </div>
          )}
          {tab === 'notes' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📝 תרשומות</SectionTitle>
              <NotesWidget notes={notes} loading={notesLoading} currentUser={currentUser}
                onAdd={async (fields) => { const { data } = await supabase.from('apartment_notes').insert([{ apartment_id: selected.id, ...fields }]).select().single(); setNotes(p => [data, ...p]) }}
                onDelete={async (id) => { await supabase.from('apartment_notes').delete().eq('id', id); setNotes(p => p.filter(n => n.id !== id)) }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>🏠 דירות ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 9 }}>
          <input placeholder="🔍 חיפוש כתובת..." value={search} onChange={e => setSearch(e.target.value)} className="v2-input" style={{ minWidth: 200, fontSize: 13 }} />
          <button className="v2-btn v2-btn-primary" onClick={() => { setEditApt(null); setShowForm(true) }}>+ דירה חדשה</button>
        </div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60, color: GRAY }}>טוען...</div>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏠</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 8 }}>אין דירות עדיין</div>
            <button className="v2-btn v2-btn-primary" onClick={() => { setEditApt(null); setShowForm(true) }}>+ הוסף דירה</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(a => (
              <div key={a.id} onClick={() => { setSelected(a); setTab('info') }}
                className="v2-card" style={{ padding: 18, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏠</div>
                  <span className="badge" style={{ background: a.status === 'active' ? '#F0FDF9' : LGRAY, color: a.status === 'active' ? '#0F766E' : GRAY }}>
                    {a.status === 'active' ? '● פעיל' : '○ לא פעיל'}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 3 }}>{a.address}</div>
                {a.city && <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>📍 {a.city}{a.floor && ' · קומה ' + a.floor}</div>}
                <div style={{ fontSize: 12, color: GRAY, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {a.owner_name && <span>👤 {a.owner_name}</span>}
                  {a.rent_amount && <span>💰 ₪{a.rent_amount}/חודש</span>}
                </div>
                {a.end_date && (
                  <div style={{ marginTop: 10, padding: '6px 10px', background: isExpired(a.end_date) ? '#FFF1F2' : isSoon(a.end_date) ? '#FFFBEB' : '#F0FDF9', borderRadius: 8, fontSize: 12, color: isExpired(a.end_date) ? '#DC2626' : isSoon(a.end_date) ? '#D97706' : '#0F766E', fontWeight: 600 }}>
                    📅 חוזה עד {fmtDate(a.end_date)} {isExpired(a.end_date) ? '🔴' : isSoon(a.end_date) ? '🟡' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ─── TASKS MODULE ─────────────────────────────────────────────────────────────
function TasksModule({ candidates, currentUser }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')
  const [filterPriority, setFilterPriority] = useState('')
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', candidate_id: '', due_date: '', priority: 'normal' })

  useEffect(() => { fetchTasks().then(d => { setTasks(d); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const add = async () => {
    if (!form.title.trim()) return
    const t = await insertTask({ ...form, status: 'open', created_by: currentUser })
    setTasks(p => [t, ...p]); setShowForm(false)
    setForm({ title: '', description: '', assigned_to: '', candidate_id: '', due_date: '', priority: 'normal' })
  }
  const toggle = async (task) => {
    const s = task.status === 'open' ? 'done' : 'open'
    await updateTask(task.id, { status: s, completed_at: s === 'done' ? new Date().toISOString() : null })
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: s } : t))
  }
  const remove = async (id) => { await deleteTask(id); setTasks(p => p.filter(t => t.id !== id)) }

  const filtered = tasks.filter(t =>
    (!filterAssignee || t.assigned_to === filterAssignee) &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority)
  )

  const PRIORITY = { urgent: { label: '🔴 דחוף', bg: '#FFF1F2', fg: '#BE123C' }, high: { label: '🟠 גבוה', bg: '#FFF7ED', fg: '#C2410C' }, normal: { label: '🟢 רגיל', bg: '#F0FDF9', fg: '#0F766E' }, low: { label: '⚪ נמוך', bg: LGRAY, fg: GRAY } }
  const open = tasks.filter(t => t.status === 'open').length
  const done = tasks.filter(t => t.status === 'done').length
  const INP_S = { padding: '10px 13px', background: LGRAY, border: '1.5px solid ' + BORDER, borderRadius: 10, color: DARK, fontFamily: F, fontSize: 13, outline: 'none', width: '100%' }

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>✅ משימות</h3>
          <span className="badge" style={{ background: '#FEF9C3', color: '#854D0E' }}>{open} פתוחות</span>
          <span className="badge" style={{ background: '#F0FDF4', color: '#166534' }}>{done} הושלמו</span>
        </div>
        <button className="v2-btn v2-btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ סגור' : '+ משימה חדשה'}</button>
      </div>

      {showForm && (
        <div className="v2-card" style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>כותרת *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="תאר את המשימה..." style={INP_S} /></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>מבצע</label><select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={{ ...INP_S, paddingLeft: 32, appearance: 'none', cursor: 'pointer' }}><option value=''>— בחר —</option>{STAFF.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>עדיפות</label><select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ ...INP_S, paddingLeft: 32, appearance: 'none', cursor: 'pointer' }}>{Object.entries(PRIORITY).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>תאריך יעד</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={INP_S} /></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>שייך למועמד</label><select value={form.candidate_id} onChange={e => set('candidate_id', e.target.value)} style={{ ...INP_S, paddingLeft: 32, appearance: 'none', cursor: 'pointer' }}><option value=''>— ללא שיוך —</option>{candidates.map(c => <option key={c.id} value={c.id}>{c.full_name_he || c.full_name_en || c.phone}</option>)}</select></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 4 }}>פרטים</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...INP_S, resize: 'vertical', lineHeight: 1.6 }} placeholder="פרטים נוספים..." /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="v2-btn v2-btn-primary" style={{ flex: 1 }} onClick={add}>✓ הוסף משימה</button>
            <button className="v2-btn v2-btn-ghost" onClick={() => setShowForm(false)}>ביטול</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['open', 'פתוחות'], ['done', 'הושלמו'], ['', 'הכל']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid ' + filterStatus === v ? BLUE : BORDER, background: filterStatus === v ? BLUE + '18' : WHITE, color: filterStatus === v ? BLUE : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>{l}</button>
        ))}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '5px 12px', border: '1.5px solid ' + BORDER, borderRadius: 20, fontSize: 12, color: GRAY, fontFamily: F, outline: 'none', background: WHITE, cursor: 'pointer', appearance: 'none' }}>
          <option value=''>כל העדיפויות</option>
          {Object.entries(PRIORITY).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ padding: '5px 12px', border: '1.5px solid ' + BORDER, borderRadius: 20, fontSize: 12, color: GRAY, fontFamily: F, outline: 'none', background: WHITE, cursor: 'pointer', appearance: 'none' }}>
          <option value=''>כל הנציגים</option>
          {STAFF.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: GRAY }}>טוען...</div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#D1D5DB', fontSize: 14 }}>אין משימות</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(t => {
                const cand = candidates.find(c => c.id === t.candidate_id)
                const done = t.status === 'done'
                const over = t.due_date && new Date(t.due_date) < new Date() && !done
                const pr = PRIORITY[t.priority || 'normal']
                return (
                  <div key={t.id} className="v2-card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, opacity: done ? .65 : 1, borderColor: over ? '#FECDD3' : '#E5E5EA' }}>
                    <button onClick={() => toggle(t)} style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid ' + done ? BLUE : BORDER, background: done ? BLUE : WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                      {done && <span style={{ color: WHITE, fontSize: 12 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: done ? 400 : 600, color: done ? GRAY : DARK, textDecoration: done ? 'line-through' : 'none', marginBottom: 5 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: GRAY, lineHeight: 1.6, marginBottom: 6, direction: 'rtl' }}>{t.description}</div>}
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                        {t.priority && t.priority !== 'normal' && <span className="badge" style={{ background: pr.bg, color: pr.fg }}>{pr.label}</span>}
                        {t.assigned_to && <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>👤 {t.assigned_to}</span>}
                        {t.created_by && <span style={{ fontSize: 11, color: GRAY }}>הוזן ע"י {t.created_by}</span>}
                        {cand && <span className="badge" style={{ background: '#F0FDF9', color: '#0F766E' }}>🔗 {cand.full_name_he || cand.full_name_en}</span>}
                        {t.due_date && <span style={{ fontSize: 11, background: over ? '#FFF1F2' : LGRAY, color: over ? '#BE123C' : GRAY, padding: '2px 9px', borderRadius: 20, fontWeight: over ? 700 : 400 }}>📅 {fmtDate(t.due_date)} {over ? '⚠️' : ''}</span>}
                      </div>
                    </div>
                    <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 15, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}

// ─── DOCUMENTS MODULE ─────────────────────────────────────────────────────────
function DocumentsModule({ candidates, currentUser }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', description: '', category: 'general', content: '' })
  const fileRef = useRef()

  useEffect(() => {
    supabase.from('document_templates').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setTemplates(data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const path = Date.now() + '_' + file.name
      await supabase.storage.from('document-templates').upload(path, file)
      const { data } = await supabase.from('document_templates').insert([{ name: file.name.replace(/\.[^.]+$/, ''), description: 'הועלה ' + new Date().toLocaleDateString('he-IL'), file_path: path, created_by: currentUser, category: 'uploaded' }]).select().single()
      setTemplates(p => [data, ...p])
    } catch (e) { alert('שגיאה בהעלאה') }
    finally { setUploading(false) }
  }

  const CATS = { general: '📄 כללי', contract: '📝 חוזה', report: '📊 דוח', letter: '✉️ מכתב', uploaded: '📎 הועלה' }

  if (selected) {
    const [editContent, setEditContent] = useState(selected.content || '')
    const [editName, setEditName] = useState(selected.name)
    const [saving, setSaving] = useState(false)
    const save = async () => {
      setSaving(true)
      await supabase.from('document_templates').update({ name: editName, content: editContent }).eq('id', selected.id)
      setTemplates(p => p.map(t => t.id === selected.id ? { ...t, name: editName, content: editContent } : t))
      setSaving(false); alert('נשמר ✓')
    }
    return (
      <div style={{ padding: '24px 28px' }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="v2-btn v2-btn-ghost" onClick={() => setSelected(null)}>← חזרה</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: DARK, flex: 1 }}>{editName}</div>
          <button className="v2-btn v2-btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : '💾 שמור'}</button>
          <button className="v2-btn v2-btn-ghost" onClick={() => window.print()}>🖨️ הדפס</button>
          <button className="v2-btn v2-btn-danger" onClick={() => { if (window.confirm('למחוק?')) { supabase.from('document_templates').delete().eq('id', selected.id); setTemplates(p => p.filter(t => t.id !== selected.id)); setSelected(null) } }}>🗑️</button>
        </div>
        <div className="v2-card" style={{ padding: 22 }}>
          <Inp label="שם המסמך" value={editName} onChange={setEditName} />
          <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 5 }}>תוכן המסמך</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={22} className="v2-input" style={{ resize: 'vertical', lineHeight: 1.8, fontSize: 14 }} placeholder="הזן את תוכן המסמך..." />
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, color: BLUE, lineHeight: 1.7 }}>
            💡 השתמש ב: <strong>{'{{שם_עובד}}'}</strong> · <strong>{'{{תאריך}}'}</strong> · <strong>{'{{מעסיק}}'}</strong> · <strong>{'{{ויזה}}'}</strong>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>📋 מסמכים ותבניות</h3>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="v2-btn v2-btn-ghost" onClick={() => fileRef.current.click()} disabled={uploading}>{uploading ? 'מעלה...' : '📎 העלה קובץ'}</button>
          <button className="v2-btn v2-btn-primary" onClick={() => setShowNew(true)}>+ תבנית חדשה</button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />
        </div>
      </div>

      <div className={'drag-zone' + isDragging ? ' over' : ''} style={{ marginBottom: 22 }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current.click()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: isDragging ? BLUE : DARK, marginBottom: 4 }}>גרור קובץ לכאן</div>
        <div style={{ fontSize: 13, color: GRAY }}>או לחץ לבחירה · PDF, Word, TXT</div>
      </div>

      {showNew && (
        <div className="v2-card" style={{ padding: 20, marginBottom: 20 }}>
          <SectionTitle action={<button className="v2-btn v2-btn-ghost" onClick={() => setShowNew(false)}>ביטול</button>}>תבנית חדשה</SectionTitle>
          <Inp label="שם התבנית" value={newForm.name} onChange={v => setNewForm(p => ({ ...p, name: v }))} />
          <Inp label="תיאור" value={newForm.description} onChange={v => setNewForm(p => ({ ...p, description: v }))} />
          <Inp label="תוכן ראשוני" value={newForm.content} onChange={v => setNewForm(p => ({ ...p, content: v }))} rows={4} placeholder="הזן תוכן..." />
          <button className="v2-btn v2-btn-primary" style={{ width: '100%', marginTop: 4 }}
            onClick={async () => { const { data } = await supabase.from('document_templates').insert([{ ...newForm, created_by: currentUser }]).select().single(); setTemplates(p => [data, ...p]); setShowNew(false); setNewForm({ name: '', description: '', category: 'general', content: '' }) }}>
            + צור תבנית
          </button>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: GRAY }}>טוען...</div>
        : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 6 }}>אין מסמכים עדיין</div>
            <div style={{ fontSize: 13, color: GRAY }}>העלה קובץ או צור תבנית חדשה</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {templates.map(t => (
              <div key={t.id} onClick={() => setSelected(t)}
                className="v2-card" style={{ padding: 18, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{t.file_path ? '📎' : '📄'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>{t.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, background: LGRAY, color: GRAY, padding: '2px 9px', borderRadius: 20 }}>{CATS[t.category] || '📄'}</span>
                  {t.created_by && <span style={{ fontSize: 11, color: GRAY }}>👤 {t.created_by}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}


// ─── EMPLOYERS MODULE ─────────────────────────────────────────────────────────
function EmployersModule({ candidates, currentUser }) {
  const [employers, setEmployers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [editEmp, setEditEmp]     = useState(null)
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState('info')
  const [notes, setNotes]         = useState([])
  const [notesLoading, setNotesLoading] = useState(false)

  const SECTOR_COLORS = { construction:'#0F766E', industry:'#1D4ED8', commerce:'#7C3AED', agriculture:'#22C55E', restaurant:'#D97706', hospitality:'#DC2626', other:'#9CA3AF' }
  const EMPTY = { name:'', company_id:'', sector:'', address:'', city:'', phone:'', email:'', website:'', contact_name:'', contact_role:'', contact_phone:'', contact_email:'', workers_quota:'', status:'active' }

  const load = async () => {
    const { data } = await supabase.from('employers').select('*').order('created_at', { ascending: false })
    setEmployers(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected || tab !== 'notes') return
    setNotesLoading(true)
    supabase.from('employer_notes').select('*').eq('employer_id', selected.id).order('note_date', { ascending: false })
      .then(({ data }) => { setNotes(data || []); setNotesLoading(false) })
  }, [selected, tab])

  const myWorkers = selected ? candidates.filter(c => c.placement === selected.name) : []

  const filtered = employers.filter(e => {
    const q = search.toLowerCase()
    return !q || [e.name, e.company_id, e.city, e.contact_name].some(v => (v || '').toLowerCase().includes(q))
  })

  // ── FORM ──
  if (showForm) {
    const f = editEmp || {}
    const [lf, setLf] = useState({ ...EMPTY, ...f })
    const sl = (k, v) => setLf(p => ({ ...p, [k]: v }))
    return (
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '22px 20px' }} className="fade-in">
        <div className="v2-card" style={{ padding: 22 }}>
          <SectionTitle action={<button className="v2-btn v2-btn-ghost" onClick={() => { setShowForm(false); setEditEmp(null) }}>ביטול</button>}>
            {editEmp ? 'עריכת מעסיק' : '+ מעסיק חדש'}
          </SectionTitle>
          <div style={{ marginBottom: 12, fontWeight: 700, color: DARK, fontSize: 13 }}>פרטי העסק</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><Inp label="שם העסק *" value={lf.name} onChange={v => sl('name', v)} /></div>
            <Inp label="ח.פ / ע.מ" value={lf.company_id} onChange={v => sl('company_id', v)} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: GRAY, marginBottom: 5 }}>ענף</label>
              <div style={{ position: 'relative' }}>
                <select value={lf.sector || ''} onChange={e => sl('sector', e.target.value)} className="v2-input v2-select" style={{ paddingLeft: 32 }}>
                  <option value=''>— בחר —</option>
                  {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he} / {s.en}</option>)}
                </select>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: GRAY, fontSize: 10 }}>▼</span>
              </div>
            </div>
            <Inp label="טלפון" value={lf.phone} onChange={v => sl('phone', v)} type="tel" />
            <Inp label="אימייל" value={lf.email} onChange={v => sl('email', v)} type="email" />
            <Inp label="כתובת" value={lf.address} onChange={v => sl('address', v)} />
            <Inp label="עיר" value={lf.city} onChange={v => sl('city', v)} />
            <Inp label="אתר אינטרנט" value={lf.website} onChange={v => sl('website', v)} />
            <Inp label="מכסת עובדים" value={lf.workers_quota} onChange={v => sl('workers_quota', v)} type="number" />
          </div>
          <div style={{ marginBottom: 12, marginTop: 6, fontWeight: 700, color: DARK, fontSize: 13 }}>איש קשר</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="שם איש קשר" value={lf.contact_name} onChange={v => sl('contact_name', v)} />
            <Inp label="תפקיד" value={lf.contact_role} onChange={v => sl('contact_role', v)} />
            <Inp label="טלפון ישיר" value={lf.contact_phone} onChange={v => sl('contact_phone', v)} type="tel" />
            <Inp label="אימייל ישיר" value={lf.contact_email} onChange={v => sl('contact_email', v)} type="email" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[['active','פעיל'],['inactive','לא פעיל']].map(([v, l]) => (
              <button key={v} onClick={() => sl('status', v)}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid ' + lf.status === v ? BLUE : BORDER, background: lf.status === v ? BLUE + '18' : WHITE, color: lf.status === v ? BLUE : GRAY, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                {l}
              </button>
            ))}
          </div>
          <button className="v2-btn v2-btn-primary" style={{ width: '100%' }}
            onClick={async () => {
              if (!lf.name.trim()) { alert('שם העסק הוא שדה חובה'); return }
              if (editEmp) {
                await supabase.from('employers').update(lf).eq('id', editEmp.id)
                setEmployers(p => p.map(e => e.id === editEmp.id ? { ...e, ...lf } : e))
                if (selected?.id === editEmp.id) setSelected(s => ({ ...s, ...lf }))
              } else {
                const { data } = await supabase.from('employers').insert([lf]).select().single()
                setEmployers(p => [data, ...p])
              }
              setShowForm(false); setEditEmp(null)
            }}>
            {editEmp ? '💾 שמור שינויים' : '+ הוסף מעסיק'}
          </button>
        </div>
      </div>
    )
  }

  // ── EMPLOYER DETAIL ──
  if (selected) {
    const color = SECTOR_COLORS[selected.sector] || '#9CA3AF'
    const row = (icon, label, val) => val ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
        <span style={{ fontSize: 12, color: GRAY }}>{icon} {label}</span>
        <span style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{val}</span>
      </div>
    ) : null
    return (
      <div className="fade-in" style={{ background: CREAM, minHeight: 'calc(100vh - 54px)' }}>
        <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          <button className="v2-btn v2-btn-ghost" onClick={() => setSelected(null)}>← חזרה</button>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '18', border: '1.5px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color }}>
            {selected.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: DARK }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: GRAY }}>
              {selected.company_id && 'ח.פ ' + selected.company_id + ' · '}
              {SECTORS.find(s => s.v === selected.sector)?.he}
              {selected.city && ' · ' + selected.city}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <span className="badge" style={{ background: selected.status === 'active' ? '#F0FDF9' : LGRAY, color: selected.status === 'active' ? '#0F766E' : GRAY }}>
              {selected.status === 'active' ? '● פעיל' : '○ לא פעיל'}
            </span>
            {selected.phone && <a href={'tel:' + selected.phone} className="v2-btn v2-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>📞</a>}
            {selected.contact_phone && <a href={'https://wa.me/' + selected.contact_phone.replace(/[^0-9]/g,'')} target="_blank" rel="noreferrer" className="v2-btn v2-btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>💬 WA</a>}
            <button className="v2-btn v2-btn-ghost" onClick={() => { setEditEmp(selected); setShowForm(true) }}>✏️ ערוך</button>
            <button className="v2-btn v2-btn-danger" style={{ fontSize: 12 }} onClick={async () => { if (window.confirm('למחוק?')) { await supabase.from('employers').delete().eq('id', selected.id); setEmployers(p => p.filter(e => e.id !== selected.id)); setSelected(null) } }}>🗑️</button>
          </div>
        </div>

        <div style={{ background: WHITE, borderBottom: '1.5px solid #E5E5EA', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
          {[['info','📋 פרטים'],['workers','👥 עובדים משובצים (' + myWorkers.length + ')'],['notes','📝 תרשומות']].map(([k,l]) => (
            <button key={k} className={'tab-btn' + tab===k?' active':''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ maxWidth: 700, margin: '22px auto', padding: '0 20px 60px' }}>
          {tab === 'info' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>פרטי העסק</SectionTitle>
              {row('🏢','שם',selected.name)}
              {row('🆔','ח.פ / ע.מ',selected.company_id)}
              {row('⚙️','ענף',SECTORS.find(s=>s.v===selected.sector)?.he)}
              {row('📍','כתובת',[selected.address,selected.city].filter(Boolean).join(', '))}
              {row('📞','טלפון',selected.phone)}
              {row('📧','אימייל',selected.email)}
              {row('🌐','אתר',selected.website)}
              {row('👷','מכסת עובדים',selected.workers_quota?selected.workers_quota + ' עובדים':null)}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1.5px solid #F3F4F6', fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>איש קשר</div>
              {row('👤','שם',selected.contact_name)}
              {row('💼','תפקיד',selected.contact_role)}
              {row('📱','טלפון',selected.contact_phone)}
              {row('📧','אימייל',selected.contact_email)}
              <div style={{ marginTop: 10, fontSize: 11, color: '#D1D5DB', textAlign: 'center' }}>נוצר {fmtDate(selected.created_at)} · #{selected.id.slice(0,8)}</div>
            </div>
          )}

          {tab === 'workers' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>👥 עובדים משובצים ({myWorkers.length})</SectionTitle>
              {myWorkers.length === 0
                ? <div style={{ textAlign: 'center', padding: 40, color: '#D1D5DB', fontSize: 13 }}>אין עובדים משובצים למעסיק זה</div>
                : myWorkers.map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: LGRAY, borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{w.full_name_he || w.full_name_en}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{w.phone} · {SECTORS.find(s=>s.v===w.sector)?.he}</div>
                    </div>
                    <div style={{ fontSize: 12, color: GRAY }}>
                      {w.placement_date && 'מאז ' + fmtDate(w.placement_date)}
                    </div>
                  </div>
                ))}
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, color: BLUE }}>
                💡 שיבוץ עובדים נעשה מתוך כרטיס העובד ← לשונית שיבוץ
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="v2-card fade-in" style={{ padding: 22 }}>
              <SectionTitle>📝 תרשומות</SectionTitle>
              <NotesWidget notes={notes} loading={notesLoading} currentUser={currentUser}
                onAdd={async (fields) => {
                  const { data } = await supabase.from('employer_notes').insert([{ employer_id: selected.id, ...fields }]).select().single()
                  setNotes(p => [data, ...p])
                }}
                onDelete={async (id) => {
                  await supabase.from('employer_notes').delete().eq('id', id)
                  setNotes(p => p.filter(n => n.id !== id))
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── EMPLOYERS LIST ──
  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>🏢 מעסיקים ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 9 }}>
          <input placeholder="🔍 חיפוש שם, עיר..." value={search} onChange={e => setSearch(e.target.value)}
            className="v2-input" style={{ minWidth: 200, fontSize: 13 }} />
          <button className="v2-btn v2-btn-primary" onClick={() => { setEditEmp(null); setShowForm(true) }}>+ מעסיק חדש</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: GRAY }}>טוען...</div>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏢</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 8 }}>אין מעסיקים עדיין</div>
            <button className="v2-btn v2-btn-primary" onClick={() => { setEditEmp(null); setShowForm(true) }}>+ הוסף מעסיק</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(e => {
              const color = SECTOR_COLORS[e.sector] || '#9CA3AF'
              const workerCount = candidates.filter(c => c.placement === e.name).length
              return (
                <div key={e.id} onClick={() => { setSelected(e); setTab('info') }}
                  className="v2-card" style={{ padding: 18, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'; ev.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={ev => { ev.currentTarget.style.boxShadow = ''; ev.currentTarget.style.transform = '' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '18', border: '1.5px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color }}>
                      {e.name[0]}
                    </div>
                    <span className="badge" style={{ background: e.status === 'active' ? '#F0FDF9' : LGRAY, color: e.status === 'active' ? '#0F766E' : GRAY }}>
                      {e.status === 'active' ? '● פעיל' : '○ לא פעיל'}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 3 }}>{e.name}</div>
                  {e.company_id && <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>ח.פ {e.company_id}</div>}
                  <div style={{ fontSize: 12, color: GRAY, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
                    {e.city && <span>📍 {e.city}</span>}
                    {e.contact_name && <span>👤 {e.contact_name}{e.contact_role ? ' · ' + e.contact_role : ''}</span>}
                    {e.phone && <span>📞 {e.phone}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                    <span style={{ background: color + '18', color, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                      {SECTORS.find(s => s.v === e.sector)?.he || 'ענף'}
                    </span>
                    {workerCount > 0
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>👥 {workerCount} עובדים</span>
                      : <span style={{ fontSize: 12, color: '#D1D5DB' }}>אין עובדים</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}




// ─── WORKER EVENTS TAB ───────────────────────────────────────────────────────
const EVENT_TYPES = [
  { v: 'employment_start', icon: '🏢', label: 'תחילת העסקה',    color: '#059669', bg: '#F0FDF9' },
  { v: 'employer_change',  icon: '🔄', label: 'מעבר מעסיק',     color: '#0071E3', bg: '#EFF6FF' },
  { v: 'injury',           icon: '🩹', label: 'פציעה',           color: '#C2410C', bg: '#FFF7ED' },
  { v: 'escape',           icon: '🚨', label: 'בריחה',           color: '#BE123C', bg: '#FFF1F2' },
  { v: 'fired',            icon: '📄', label: 'פיטורין',         color: '#DC2626', bg: '#FFF1F2' },
  { v: 'resigned',         icon: '✍️', label: 'התפטרות',         color: '#6B7280', bg: '#F5F5F7' },
  { v: 'hearing',          icon: '⚖️', label: 'שימוע',           color: '#B45309', bg: '#FFFBEB' },
  { v: 'hospitalization',  icon: '🏥', label: 'אשפוז',           color: '#1D4ED8', bg: '#EFF6FF' },
  { v: 'permit_renewal',   icon: '🪪', label: 'חידוש היתר',      color: '#7C3AED', bg: '#F5F3FF' },
  { v: 'salary_change',    icon: '💰', label: 'שינוי שכר',       color: '#0F766E', bg: '#F0FDF9' },
  { v: 'note',             icon: '📝', label: 'הערה כללית',      color: '#6E6E73', bg: '#F5F5F7' },
]

function EventsTab({ candidateId, currentUser }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'employment_start',
    employer: '', description: ''
  })
  const [docFile, setDocFile] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const fileRef = useRef()

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    const { data } = await supabase.from('worker_events')
      .select('*').eq('candidate_id', candidateId)
      .order('event_date', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [candidateId])

  const addEvent = async () => {
    if (!form.event_date || !form.event_type) return
    setSaving(true)
    let doc_path = null
    if (docFile) {
      const path = candidateId + '/events/' + Date.now() + '_' + docFile.name
      await supabase.storage.from('candidate-docs').upload(path, docFile)
      doc_path = path
    }
    const { data } = await supabase.from('worker_events').insert([{
      candidate_id: candidateId,
      event_date: form.event_date,
      event_type: form.event_type,
      employer: form.employer || null,
      description: form.description || null,
      doc_path,
      created_by: currentUser,
    }]).select().single()
    setEvents(p => [data, ...p])
    setForm({ event_date: new Date().toISOString().split('T')[0], event_type: 'employment_start', employer: '', description: '' })
    setDocFile(null)
    setSaving(false)
    setShowForm(false)
  }

  const deleteEvent = async (id) => {
    await supabase.from('worker_events').delete().eq('id', id)
    setEvents(p => p.filter(e => e.id !== id))
    setConfirmDel(null)
  }

  const viewDoc = async (path) => {
    const { data } = await supabase.storage.from('candidate-docs').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const typeInfo = (v) => EVENT_TYPES.find(t => t.v === v) || { icon: '📝', label: v, color: GRAY, bg: LGRAY }

  return (
    <div>
      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: WHITE, borderRadius: 16, padding: 24, maxWidth: 320, width: '90%', fontFamily: F }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>מחיקת אירוע</div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>האם למחוק את האירוע? פעולה זו אינה הפיכה.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="v2-btn v2-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>ביטול</button>
              <button style={{ flex: 1, padding: 10, background: '#EF4444', color: WHITE, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
                onClick={() => deleteEvent(confirmDel)}>מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <div style={{ marginBottom: 16 }}>
        <button className="v2-btn v2-btn-primary" style={{ width: '100%', padding: 11 }}
          onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ סגור' : '+ הוסף אירוע'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#F0F7FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Event type */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>סוג אירוע</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.v} onClick={() => sf('event_type', t.v)}
                    style={{ padding: '6px 11px', borderRadius: 20, border: '1.5px solid ' + form.event_type === t.v ? t.color : BORDER, background: form.event_type === t.v ? t.bg : WHITE, color: form.event_type === t.v ? t.color : GRAY, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>תאריך</label>
              <input type="date" value={form.event_date} onChange={e => sf('event_date', e.target.value)} className="v2-input" />
            </div>

            {/* Employer */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>מעסיק</label>
              <input value={form.employer} onChange={e => sf('employer', e.target.value)} placeholder="שם המעסיק" className="v2-input" />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>תיאור / פרטים</label>
              <textarea value={form.description} onChange={e => sf('description', e.target.value)} rows={3}
                className="v2-input" style={{ resize: 'vertical', lineHeight: 1.6 }} placeholder="פרטים נוספים על האירוע..." />
            </div>

            {/* Doc upload */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>מסמך מצורף</label>
              <button onClick={() => fileRef.current.click()}
                style={{ width: '100%', padding: '9px 14px', background: WHITE, border: '1.5px solid ' + docFile ? BLUE : BORDER, borderRadius: 10, fontSize: 13, color: docFile ? BLUE : GRAY, cursor: 'pointer', fontFamily: F, textAlign: 'right', fontWeight: docFile ? 700 : 400 }}>
                {docFile ? '📎 ' + docFile.name : '📎 העלה מסמך (PDF, Word, תמונה)'}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }}
                onChange={e => { setDocFile(e.target.files[0]); e.target.value = '' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="v2-btn v2-btn-ghost" onClick={() => { setShowForm(false); setDocFile(null) }}>ביטול</button>
            <button className="v2-btn v2-btn-primary" style={{ flex: 1 }} onClick={addEvent} disabled={saving}>
              {saving ? 'שומר...' : '✓ שמור אירוע'}
            </button>
          </div>
        </div>
      )}

      {/* Events timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: GRAY, fontSize: 13 }}>טוען...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 6 }}>אין אירועים עדיין</div>
          <div style={{ fontSize: 13, color: GRAY }}>לחץ "+ הוסף אירוע" כדי לתעד את הראשון</div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', right: 21, top: 0, bottom: 0, width: 2, background: '#E5E5EA' }} />

          {events.map((ev, i) => {
            const t = typeInfo(ev.event_type)
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 14, marginBottom: 16, position: 'relative' }}>
                {/* Icon bubble */}
                <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', background: t.bg, border: '2px solid ' + t.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                  {t.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, background: WHITE, border: '1.5px solid ' + t.color + '30', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span className="badge" style={{ background: t.bg, color: t.color, fontSize: 12, marginLeft: 8 }}>{t.icon} {t.label}</span>
                      {ev.employer && <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>🏢 {ev.employer}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: GRAY, whiteSpace: 'nowrap' }}>
                        {new Date(ev.event_date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <button onClick={() => setConfirmDel(ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', fontSize: 14, padding: '0 2px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {ev.description && (
                    <div style={{ fontSize: 13, color: DARK, lineHeight: 1.7, direction: 'rtl', marginTop: 4 }}>{ev.description}</div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    {ev.created_by && <span style={{ fontSize: 11, color: GRAY }}>👤 הוזן ע"י {ev.created_by}</span>}
                    {ev.doc_path && (
                      <button onClick={() => viewDoc(ev.doc_path)}
                        style={{ background: LGRAY, border: '1px solid ' + BORDER, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: DARK, cursor: 'pointer', fontFamily: F, fontWeight: 600 }}>
                        📎 מסמך מצורף — צפה
                      </button>
                    )}
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

// ─── INACTIVE / TERMINATION MODAL ────────────────────────────────────────────
function InactiveModal({ candidate, onSave, onClose }) {
  const [type, setType] = useState(candidate.termination_type || '')
  const [hearing, setHearing] = useState(candidate.hearing_conducted || false)
  const [date, setDate] = useState(candidate.terminated_at || new Date().toISOString().split('T')[0])
  const [docFile, setDocFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const save = async () => {
    if (!type) { alert('יש לבחור סיבת סיום'); return }
    setSaving(true)
    let hearing_doc_path = candidate.hearing_doc_path || null
    if (docFile) {
      const path = candidate.id + '/hearing_' + Date.now() + '_' + docFile.name
      await supabase.storage.from('candidate-docs').upload(path, docFile)
      hearing_doc_path = path
    }
    await onSave({ status: 'inactive', termination_type: type, hearing_conducted: hearing, terminated_at: date, hearing_doc_path })
    setSaving(false)
    onClose()
  }

  const viewDoc = async () => {
    if (!candidate.hearing_doc_path) return
    const { data } = await supabase.storage.from('candidate-docs').createSignedUrl(candidate.hearing_doc_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: F }}>
      <div style={{ background: WHITE, borderRadius: 16, padding: 26, width: 420, maxWidth: '90vw', boxShadow: SHADOW_LG, border: '1px solid ' + BORDER }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1D1D1F', marginBottom: 4 }}>⭕ סיום העסקה</div>
        <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 22 }}>{candidate.full_name_he || candidate.full_name_en}</div>

        {/* Termination type */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6E6E73', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>סיבת סיום *</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['fired','פיטורין 📄'],['resigned','התפטרות ✍️']].map(([v,l]) => (
              <button key={v} onClick={() => setType(v)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid ' + type===v?'#DC2626':'#E5E5EA', background: type===v?'#FFF1F2':'#FAFAFA', color: type===v?'#DC2626':'#6E6E73', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: F }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Termination date */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6E6E73', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>תאריך סיום</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="v2-input" />
        </div>

        {/* Hearing */}
        <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>⚖️ שימוע</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[true,'בוצע שימוע ✅'],[false,'לא בוצע שימוע ❌']].map(([v,l]) => (
              <button key={String(v)} onClick={() => setHearing(v)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid ' + hearing===v?'#D97706':'#E5E5EA', background: hearing===v?'#FEF9C3':'#FAFAFA', color: hearing===v?'#92400E':'#6E6E73', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: F }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Hearing document */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6E6E73', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>📎 מזכר שימוע</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fileRef.current.click()}
              style={{ flex: 1, padding: '10px 14px', background: '#F5F5F7', border: '1.5px solid #D2D2D7', borderRadius: 10, fontSize: 13, color: '#1D1D1F', cursor: 'pointer', fontFamily: F, textAlign: 'right' }}>
              {docFile ? '📄 ' + docFile.name : candidate.hearing_doc_path ? '🔄 החלף מסמך' : '📎 העלה מסמך'}
            </button>
            {candidate.hearing_doc_path && !docFile && (
              <button onClick={viewDoc} style={{ padding: '10px 14px', background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: 10, fontSize: 13, color: '#4F46E5', cursor: 'pointer', fontFamily: F }}>👁 צפה</button>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" style={{ display: 'none' }}
              onChange={e => { setDocFile(e.target.files[0]); e.target.value = '' }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#F5F5F7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F, color: '#1D1D1F' }}>ביטול</button>
          <button onClick={save} disabled={saving}
            style={{ flex: 2, padding: 12, background: '#DC2626', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F, color: '#FFF' }}>
            {saving ? 'שומר...' : '✓ שמור וסיים העסקה'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── EXCEL EXPORT UTILITY ─────────────────────────────────────────────────────
function exportToExcel(rows, headers, filename) {
  // Build CSV with BOM for Hebrew support in Excel
  const bom = '\uFEFF'
  const csvHeaders = headers.map(h => '"' + h.label + '"').join(',')
  const csvRows = rows.map(row =>
    headers.map(h => {
      const val = h.fn ? h.fn(row) : (row[h.key] ?? '')
      return '"' + String(val).replace(/"/g, '""') + '"'
    }).join(',')
  )
  const csv = bom + csvHeaders + '\n' + csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename + '_' + new Date().toLocaleDateString('he-IL').replace(/\//g, '-') + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const WORKER_HEADERS_FULL = [
  { key: 'full_name_he', label: 'שם עברית' },
  { key: 'full_name_en', label: 'שם אנגלית' },
  { key: 'phone',        label: 'טלפון' },
  { key: 'country',      label: 'מדינה' },
  { key: 'sector',       label: 'ענף', fn: r => ({ construction:'בניין', industry:'תעשייה', commerce:'מסחר', agriculture:'חקלאות', restaurant:'מסעדות', hospitality:'אירוח', other:'אחר' }[r.sector] || r.sector || '') },
  { key: 'profession',   label: 'מקצוע' },
  { key: 'status',       label: 'סטטוס', fn: r => ({ active:'פעיל', new:'חדש', in_treatment:'בטיפול', injured:'פצוע', escaped:'ברחן', inactive:'לא פעיל' }[r.status] || r.status || '') },
  { key: 'placement',    label: 'שיבוץ / מעסיק' },
  { key: 'work_start_date', label: 'תחילת עבודה', fn: r => r.work_start_date ? new Date(r.work_start_date).toLocaleDateString('he-IL') : '' },
  { key: 'permit_type',  label: 'סוג ויזה' },
  { key: 'permit_expiry', label: 'תוקף ויזה', fn: r => r.permit_expiry ? new Date(r.permit_expiry).toLocaleDateString('he-IL') : '' },
  { key: 'entry_date',   label: 'תאריך כניסה', fn: r => r.entry_date ? new Date(r.entry_date).toLocaleDateString('he-IL') : '' },
  { key: 'escaped_at',   label: 'תאריך בריחה', fn: r => r.escaped_at ? new Date(r.escaped_at).toLocaleDateString('he-IL') : '' },
  { key: 'injured_at',   label: 'תאריך פציעה', fn: r => r.injured_at ? new Date(r.injured_at).toLocaleDateString('he-IL') : '' },
  { key: 'termination_type', label: 'סיבת סיום', fn: r => ({ fired:'פיטורין', resigned:'התפטרות' }[r.termination_type] || '') },
  { key: 'hearing_conducted', label: 'שימוע בוצע', fn: r => r.termination_type ? (r.hearing_conducted ? 'כן' : 'לא') : '' },
  { key: 'terminated_at', label: 'תאריך סיום', fn: r => r.terminated_at ? new Date(r.terminated_at).toLocaleDateString('he-IL') : '' },
  { key: 'created_at',   label: 'תאריך רישום', fn: r => r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '' },
]


// ─── REPORTS MODULE ───────────────────────────────────────────────────────────
function ReportsModule({ candidates }) {
  const WORKER_STATUSES_MAP = { active:'✅ פעיל', new:'🆕 חדש', in_treatment:'🏥 בטיפול', injured:'🩹 פצוע', escaped:'🚨 ברחן', inactive:'⭕ לא פעיל' }
  const SECTOR_MAP = { construction:'בניין', industry:'תעשייה', commerce:'מסחר', agriculture:'חקלאות', restaurant:'מסעדות', hospitality:'אירוח', other:'אחר' }

  const workers = candidates.filter(c => c.placement || ['active','in_treatment','escaped','injured'].includes(c.status))
  const escaped = candidates.filter(c => c.status === 'escaped')
  const inactive = candidates.filter(c => c.status === 'inactive')
  const expiring = candidates.filter(c => isSoon(c.permit_expiry))
  const expired  = candidates.filter(c => isExpired(c.permit_expiry))

  const byStatus = {}
  candidates.forEach(c => { byStatus[c.status] = (byStatus[c.status]||0)+1 })
  const bySector = {}
  candidates.forEach(c => { if(c.sector) bySector[c.sector] = (bySector[c.sector]||0)+1 })
  const byCountry = {}
  candidates.forEach(c => { if(c.country) { const k = c.country.split('/')[0].trim(); byCountry[k] = (byCountry[k]||0)+1 } })
  const byEmployer = {}
  candidates.filter(c=>c.placement).forEach(c => { byEmployer[c.placement] = (byEmployer[c.placement]||0)+1 })

  const REPORTS = [
    {
      id: 'all_workers',
      icon: '👥', title: 'כל העובדים', count: workers.length, color: BLUE,
      desc: 'פרטים מלאים של כל העובדים הפעילים',
      export: () => exportToExcel(workers, WORKER_HEADERS_FULL, 'עובדים_כל')
    },
    {
      id: 'escaped',
      icon: '🚨', title: 'ברחנים', count: escaped.length, color: '#DC2626',
      desc: 'עובדים שברחו + תאריכי בריחה',
      export: () => exportToExcel(escaped, [
        { key: 'full_name_he', label: 'שם עברית' },
        { key: 'full_name_en', label: 'שם אנגלית' },
        { key: 'phone', label: 'טלפון' },
        { key: 'country', label: 'מדינה' },
        { key: 'placement', label: 'מעסיק אחרון' },
        { key: 'escaped_at', label: 'תאריך בריחה', fn: r => r.escaped_at ? new Date(r.escaped_at).toLocaleDateString('he-IL') : '' },
        { key: 'work_start_date', label: 'תחילת עבודה', fn: r => r.work_start_date ? new Date(r.work_start_date).toLocaleDateString('he-IL') : '' },
        { key: 'permit_expiry', label: 'תוקף ויזה', fn: r => r.permit_expiry ? new Date(r.permit_expiry).toLocaleDateString('he-IL') : '' },
        { key: 'city', label: 'עיר מגורים אחרונה' },
      ], 'ברחנים')
    },
    {
      id: 'inactive',
      icon: '⭕', title: 'עובדים לא פעילים', count: inactive.length, color: GRAY,
      desc: 'פיטורין, התפטרויות ושימועים',
      export: () => exportToExcel(inactive, [
        { key: 'full_name_he', label: 'שם עברית' },
        { key: 'full_name_en', label: 'שם אנגלית' },
        { key: 'phone', label: 'טלפון' },
        { key: 'placement', label: 'מעסיק' },
        { key: 'termination_type', label: 'סיבת סיום', fn: r => ({ fired:'פיטורין', resigned:'התפטרות' }[r.termination_type] || '') },
        { key: 'hearing_conducted', label: 'שימוע', fn: r => r.hearing_conducted ? 'בוצע' : 'לא בוצע' },
        { key: 'terminated_at', label: 'תאריך סיום', fn: r => r.terminated_at ? new Date(r.terminated_at).toLocaleDateString('he-IL') : '' },
        { key: 'work_start_date', label: 'תחילת עבודה', fn: r => r.work_start_date ? new Date(r.work_start_date).toLocaleDateString('he-IL') : '' },
      ], 'עובדים_לא_פעילים')
    },
    {
      id: 'visa_expiry',
      icon: '⏱', title: 'ויזות פוקעות / פגות', count: expiring.length + expired.length, color: '#D97706',
      desc: expired.length + ' פגו, ' + expiring.length + ' קרובות לפוג',
      export: () => exportToExcel([...expired,...expiring], [
        { key: 'full_name_he', label: 'שם עברית' },
        { key: 'full_name_en', label: 'שם אנגלית' },
        { key: 'phone', label: 'טלפון' },
        { key: 'placement', label: 'מעסיק' },
        { key: 'permit_type', label: 'סוג ויזה' },
        { key: 'permit_expiry', label: 'תוקף ויזה', fn: r => r.permit_expiry ? new Date(r.permit_expiry).toLocaleDateString('he-IL') : '' },
        { key: 'permit_number', label: 'מספר היתר' },
        { key: 'status', label: 'סטטוס', fn: r => WORKER_STATUSES_MAP[r.status] || r.status || '' },
      ], 'ויזות_פוקעות')
    },
    {
      id: 'distribution',
      icon: '📊', title: 'התפלגות כללית', count: candidates.length, color: '#7C3AED',
      desc: 'לפי ענף, מדינה, סטטוס, מעסיק',
      export: () => {
        const rows = []
        rows.push({ cat: '── לפי סטטוס ──', val: '', count: '' })
        Object.entries(byStatus).forEach(([k,v]) => rows.push({ cat: 'סטטוס', val: WORKER_STATUSES_MAP[k]||k, count: v }))
        rows.push({ cat: '', val: '', count: '' })
        rows.push({ cat: '── לפי ענף ──', val: '', count: '' })
        Object.entries(bySector).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => rows.push({ cat: 'ענף', val: SECTOR_MAP[k]||k, count: v }))
        rows.push({ cat: '', val: '', count: '' })
        rows.push({ cat: '── לפי מדינה ──', val: '', count: '' })
        Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => rows.push({ cat: 'מדינה', val: k, count: v }))
        rows.push({ cat: '', val: '', count: '' })
        rows.push({ cat: '── לפי מעסיק ──', val: '', count: '' })
        Object.entries(byEmployer).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => rows.push({ cat: 'מעסיק', val: k, count: v }))
        exportToExcel(rows, [{ key:'cat', label:'קטגוריה' },{ key:'val', label:'ערך' },{ key:'count', label:'כמות' }], 'התפלגות_עובדים')
      }
    },
  ]

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, letterSpacing: '-0.3px' }}>📈 דוחות וייצוא</h3>
        <button className="v2-btn v2-btn-primary"
          onClick={() => exportToExcel(candidates, WORKER_HEADERS_FULL, 'כל_הנתונים')}>
          ⬇️ ייצוא מלא — הכל
        </button>
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 30 }}>
        {REPORTS.map(r => (
          <div key={r.id} className="v2-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{r.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: r.color, letterSpacing: '-1px' }}>{r.count}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 14 }}>{r.desc}</div>
            <button onClick={r.export}
              style={{ width: '100%', padding: '9px 0', background: r.color + '12', border: '1.5px solid ' + r.color + '33', borderRadius: 10, fontSize: 13, fontWeight: 700, color: r.color, cursor: 'pointer', fontFamily: F }}>
              ⬇️ הורד Excel (.csv)
            </button>
          </div>
        ))}
      </div>

      {/* Distribution tables inline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* By sector */}
        <div className="v2-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>⚙️ לפי ענף</div>
          {Object.entries(bySector).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: DARK }}>{SECTOR_MAP[k]||k}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: Math.round((v/candidates.length)*80), height: 6, background: BLUE + '60', borderRadius: 3 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: BLUE, minWidth: 24, textAlign: 'right' }}>{v}</span>
              </div>
            </div>
          ))}
        </div>

        {/* By status */}
        <div className="v2-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>📊 לפי סטטוס</div>
          {Object.entries(byStatus).sort((a,b)=>b[1]-a[1]).map(([k,v]) => {
            const s = WORKER_STATUS_LIST.find(x=>x.v===k) || { he: k, bg: LGRAY, fg: GRAY }
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                <span className="badge" style={{ background: s.bg, color: s.fg, fontSize: 12 }}>{s.he}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: Math.round((v/candidates.length)*80), height: 6, background: s.fg + '60', borderRadius: 3 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.fg, minWidth: 24, textAlign: 'right' }}>{v}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* By country */}
        <div className="v2-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>🌍 לפי מדינה</div>
          {Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: DARK }}>{k}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: Math.round((v/candidates.length)*80), height: 6, background: '#7C3AED60', borderRadius: 3 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', minWidth: 24, textAlign: 'right' }}>{v}</span>
              </div>
            </div>
          ))}
        </div>

        {/* By employer */}
        <div className="v2-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>🏢 לפי מעסיק</div>
          {Object.entries(byEmployer).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: DARK, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: Math.round((v/candidates.length)*80), height: 6, background: '#05966960', borderRadius: 3 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', minWidth: 24, textAlign: 'right' }}>{v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TOP BAR WITH CLOCK + GREETING ───────────────────────────────────────────
function TopBar({ module, currentUser, onRefresh, tasks = [] }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const h = now.getHours()
  const greeting =
    h >= 5  && h < 10 ? 'בוקר טוב ☀️' :
    h >= 10 && h < 12 ? 'זמן קפה ☕' :
    h >= 12 && h < 14 ? 'צהריים טובים 🍽️' :
    h >= 14 && h < 17 ? 'אחר הצהריים 🌤️' :
    h >= 17 && h < 21 ? 'ערב טוב 🌆' :
    h >= 21            ? 'לילה טוב 🌙' : 'טוב שחזרת 🦉'

  const NAV_LABELS = {
    dashboard:'דשבורד', applicants:'מועמדים', workers:'עובדים',
    apartments:'דירות', employers:'מעסיקים', tasks:'משימות',
    documents:'מסמכים', reports:'דוחות'
  }

  return (
    <div className="crm-topbar" style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}>
        <span style={{ fontSize: 13, color: GRAY }}>{NAV_LABELS[module] || ''}</span>
        <span style={{ fontSize: 13, color: GRAY2 }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{currentUser}</span>
      </div>

      {/* Search — centered */}
      <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
        <input
          placeholder="חיפוש..."
          style={{ width: '100%', padding: '8px 14px 8px 34px', background: LGRAY, border: '1px solid ' + BORDER, borderRadius: 10, fontSize: 13, fontFamily: F, color: DARK, outline: 'none', transition: 'all .15s' }}
          onFocus={e => { e.target.style.background = WHITE; e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(0,102,255,.1)' }}
          onBlur={e => { e.target.style.background = LGRAY; e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none' }}
        />
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4.5" stroke={GRAY2} strokeWidth="1.5"/>
          <path d="M10 10L12.5 12.5" stroke={GRAY2} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      <div style={{ flex: 1 }} />

      {/* Clock */}
      <div style={{ fontSize: 12.5, fontWeight: 600, color: DARK, fontVariantNumeric: 'tabular-nums', letterSpacing: '.5px' }}>
        {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Greeting pill */}
      <div style={{ fontSize: 11.5, color: GRAY, background: LGRAY, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
        {greeting}
      </div>

      <div style={{ width: 1, height: 20, background: BORDER }} />

      {/* Refresh */}
      <button onClick={onRefresh}
        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid ' + BORDER, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: GRAY, fontSize: 15, transition: 'all .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = LGRAY}
        onMouseLeave={e => e.currentTarget.style.background = WHITE}>
        ↻
      </button>

      {/* Bell */}
      <div style={{ position: 'relative' }}>
        <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid ' + BORDER, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}>
          🔔
        </button>
        {tasks.filter(t => t.status === 'open' && t.assigned_to === currentUser).length > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#EF4444', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid ' + WHITE }}>
            {tasks.filter(t => t.status === 'open' && t.assigned_to === currentUser).length}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, ' + BLUE + ', #0044BB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 13, fontWeight: 800, cursor: 'default', boxShadow: '0 2px 6px rgba(0,102,255,.25)' }}
        title={currentUser}>
        {currentUser?.[0] || 'א'}
      </div>
    </div>
  )
}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const h = now.getHours()
  const greeting =
    h >= 5  && h < 10 ? 'בוקר טוב, ' + currentUser + ' ☀️' :
    h >= 10 && h < 12 ? 'זמן קפה? ☕' :
    h >= 12 && h < 14 ? 'צהריים טובים, ' + currentUser + ' 🍽️' :
    h >= 14 && h < 17 ? 'אחר הצהריים 🌤️' :
    h >= 17 && h < 21 ? 'ערב טוב, ' + currentUser + ' 🌆' :
    h >= 21            ? 'לילה טוב 🌙' :
                         'טוב שחזרת.. 🦉'

  const NAV_LABELS = {
    dashboard:'דשבורד', applicants:'מועמדים', workers:'עובדים',
    apartments:'דירות', employers:'מעסיקים', tasks:'משימות',
    documents:'מסמכים', reports:'דוחות'
  }
  const NAV_ICONS = {
    dashboard:'📊', applicants:'🎯', workers:'👥',
    apartments:'🏠', employers:'🏢', tasks:'✅',
    documents:'📋', reports:'📈'
  }

  return (
    <div className="crm-topbar" style={{ padding: '0 22px', display: 'flex', alignItems: 'center', gap: 12, height: 54 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: BLUE_L, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
          {NAV_ICONS[module] || '•'}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: DARK, letterSpacing: '-.25px' }}>{NAV_LABELS[module] || ''}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Greeting */}
      <div style={{ fontSize: 12, color: GRAY2, fontWeight: 500, letterSpacing: '-.1px' }}>
        {greeting}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 16, background: BORDER, flexShrink: 0 }} />

      {/* Live Clock */}
      <div style={{ background: DARK, color: 'rgba(255,255,255,.9)', borderRadius: 8, padding: '5px 11px', fontSize: 13.5, fontWeight: 700, letterSpacing: '1.2px', fontVariantNumeric: 'tabular-nums', minWidth: 86, textAlign: 'center', fontFamily: 'monospace' }}>
        {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* Refresh */}
      <button className="v2-btn v2-btn-ghost" style={{ fontSize: 14, padding: '5px 10px', borderRadius: 8 }} onClick={onRefresh}
        title="רענן נתונים">↻</button>

      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, ' + BLUE + ' 0%, #0033AA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 13, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,102,255,.28), 0 0 0 2px rgba(0,102,255,.15)', cursor: 'default', flexShrink: 0 }}
        title={currentUser}>
        {currentUser?.[0] || 'א'}
      </div>
    </div>
  )
}

// ─── MAIN CRM ─────────────────────────────────────────────────────────────────
export default function CRM({ session, onLogout }) {
  useStyles()
  const [module, setModule] = useState('dashboard')
  const [candidates, setCandidates] = useState([])
  const [tasks, setTasks] = useState([])
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState('')
  const [toast, setToast] = useState(null)

  const userEmail = session?.user?.email || ''
  useEffect(() => {
    const name = STAFF.find(s => userEmail.toLowerCase().includes(s)) || userEmail.split('@')[0]
    setCurrentUser(name || 'נציג')
  }, [userEmail])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Supabase Realtime — listen for new tasks and notify assigned user
  useEffect(() => {
    if (!currentUser) return
    const channel = supabase
      .channel('tasks-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
        const task = payload.new
        if (task.assigned_to === currentUser) {
          // In-app toast
          setToast({ msg: 'משימה חדשה: ' + task.title, type: 'task' })
          setTimeout(() => setToast(null), 5000)
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Oz Hadar CRM — משימה חדשה 📋', {
              body: task.title + '\nמוגדר לך ע"י ' + task.created_by || 'צוות',
              icon: '/favicon.ico',
              tag: task.id,
            })
          }
          // Reload tasks if on tasks module
          loadAll()
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentUser])

  const loadAll = useCallback(async () => {
    try {
      const [cands, tsks, apts] = await Promise.all([
        fetchCandidates(),
        fetchTasks(),
        supabase.from('apartments').select('*').then(r => r.data || [])
      ])
      setCandidates(cands)
      setTasks(tsks)
      setApartments(apts)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const update = async (id, changes) => {
    await updateCandidate(id, changes)
    setCandidates(p => p.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  const remove = async (id) => {
    await deleteCandidate(id)
    setCandidates(p => p.filter(c => c.id !== id))
  }

  const NAV = [
    { k: 'dashboard',  icon: '📊', label: 'דשבורד' },
    { k: 'applicants', icon: '🎯', label: 'מועמדים', badge: candidates.filter(c => c.status === 'new').length },
    { k: 'workers',    icon: '👥', label: 'עובדים' },
    { k: 'apartments', icon: '🏠', label: 'דירות' },
    { k: 'employers',  icon: '🏢', label: 'מעסיקים' },
    { k: 'tasks',      icon: '✅', label: 'משימות', badge: tasks.filter(t => t.status === 'open').length },
    { k: 'documents',  icon: '📋', label: 'מסמכים' },
    { k: 'reports',    icon: '📈', label: 'דוחות' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: F, background: SIDEBAR_BG, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, ' + BLUE + ' 0%, #0033AA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: WHITE, boxShadow: '0 8px 28px rgba(0,102,255,.4)' }}>OZ</div>
        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, fontWeight: 500, letterSpacing: '.3px' }} className="pulse">טוען מערכת...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: F, direction: 'rtl', background: CREAM, WebkitFontSmoothing: 'antialiased' }}>

      {/* Toast notification */}
      {toast && (
        <div className="fade-in-fast" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: DARK2, color: WHITE, borderRadius: 13, padding: '14px 18px', boxShadow: SHADOW_LG, display: 'flex', alignItems: 'center', gap: 12, fontFamily: F, maxWidth: 360, border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>משימה חדשה שובצה אליך</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: WHITE, cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 6, fontFamily: F }}>✕</button>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <div style={{ width: 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '0', overflowY: 'auto', borderLeft: '1px solid ' + SIDEBAR_BORDER }}>

        {/* Logo */}
        <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid ' + SIDEBAR_BORDER, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/>
                <path d="M8 1.5C8 1.5 11 5 11 8C11 11 8 14.5 8 14.5M8 1.5C8 1.5 5 5 5 8C5 11 8 14.5 8 14.5M1.5 8H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DARK, letterSpacing: '-.3px', lineHeight: 1.15 }}>Ozhadar</div>
              <div style={{ fontSize: 10, color: GRAY2, fontWeight: 500, letterSpacing: '.2px' }}>CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '6px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GRAY2, letterSpacing: '.8px', textTransform: 'uppercase', padding: '8px 4px 6px' }}>ראשי</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.slice(0,5).map(n => (
              <button key={n.k} className={'nav-btn' + module === n.k ? ' active' : ''} onClick={() => setModule(n.k)}>
                <span className="nav-icon">{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && (
                  <span style={{ background: n.k === 'applicants' ? '#EDE9FE' : BLUE_L, color: n.k === 'applicants' ? '#7C3AED' : BLUE, borderRadius: 5, fontSize: 10, fontWeight: 800, padding: '1px 6px', lineHeight: 1.6 }}>{n.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: GRAY2, letterSpacing: '.8px', textTransform: 'uppercase', padding: '14px 4px 6px' }}>כלים</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.slice(5).map(n => (
              <button key={n.k} className={'nav-btn' + module === n.k ? ' active' : ''} onClick={() => setModule(n.k)}>
                <span className="nav-icon">{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && (
                  <span style={{ background: BLUE_L, color: BLUE, borderRadius: 5, fontSize: 10, fontWeight: 800, padding: '1px 6px', lineHeight: 1.6 }}>{n.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid ' + SIDEBAR_BORDER }}>
          <div style={{ background: LGRAY, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: GRAY2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>סיכום</div>
            <div style={{ color: DARK, fontSize: 12, marginBottom: 2 }}>👥 {candidates.length} עובדים</div>
            <div style={{ color: DARK, fontSize: 12, marginBottom: 2 }}>✅ {tasks.filter(t => t.status === 'open').length} משימות</div>
            {candidates.filter(c => isSoon(c.permit_expiry)).length > 0 && (
              <div style={{ color: '#B45309', fontSize: 12 }}>⚠️ {candidates.filter(c => isSoon(c.permit_expiry)).length} ויזות</div>
            )}
          </div>
          <button onClick={onLogout} className="nav-btn" style={{ color: GRAY }}>
            <span className="nav-icon">🚪</span><span style={{ fontSize: 12 }}>התנתק</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflow: 'auto', background: CREAM, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar module={module} currentUser={currentUser} onRefresh={loadAll} tasks={tasks} />

        {/* Module content */}
        {module === 'dashboard' && <Dashboard candidates={candidates} tasks={tasks} apartments={apartments} onNavigate={setModule} currentUser={currentUser} />}
        {module === 'applicants' && <ApplicantsModule candidates={candidates} onUpdate={update} onDelete={remove} currentUser={currentUser} />}
        {module === 'workers'    && <WorkersModule    candidates={candidates} onUpdate={update} onDelete={remove} currentUser={currentUser} />}
        {module === 'apartments' && <ApartmentsModule candidates={candidates} currentUser={currentUser} />}
        {module === 'tasks'      && <TasksModule      candidates={candidates} currentUser={currentUser} />}
        {module === 'documents'  && <DocumentsModule  candidates={candidates} currentUser={currentUser} />}
        {module === 'reports'    && <ReportsModule    candidates={candidates} />}
        {module === 'employers'  && <EmployersModule candidates={candidates} currentUser={currentUser} />}
      </div>
    </div>
  )
}
