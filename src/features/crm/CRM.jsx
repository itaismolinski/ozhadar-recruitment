import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchCandidates, updateCandidate, deleteCandidate, getDocUrl, uploadDoc,
  fetchTasks, insertTask, updateTask, deleteTask,
  fetchNotes, insertNote, deleteNote,
  fetchEmployers, insertEmployer, updateEmployer, deleteEmployer,
  fetchEmployerNotes, insertEmployerNote, deleteEmployerNote,
  fetchEmployerHistory, logEmployerEvent,
  uploadEmployerDoc, fetchEmployerDocList,
} from '../../lib/supabase.js'
import { SECTORS, PERMITS, STATUSES, DOC_FIELDS } from '../../constants.js'
import { supabase } from '../../lib/supabase.js'

// ─── DESIGN ──────────────────────────────────────────────────────────────────
const F       = "'Heebo', -apple-system, 'Arial Hebrew', Arial, sans-serif"
const TEAL    = '#0F766E'
const BLUE    = '#0071E3'
const DARK    = '#1D1D1F'
const GRAY    = '#6E6E73'
const LGRAY   = '#F5F5F7'
const BORDER  = '#D2D2D7'
const WHITE   = '#FFFFFF'
const SIDEBAR = '#1C1C1E'
const SIDEBAR2= '#2C2C2E'

const fmtDate   = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'
const isExpired = d   => d && new Date(d) < new Date()
const isSoon    = d   => { if (!d) return false; const diff=(new Date(d)-new Date())/864e5; return diff>=0 && diff<45 }

const STAFF = ['איתי', 'דוד', 'הודיה', 'מור']

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function useStyles() {
  useEffect(() => {
    if (document.getElementById('crm-styles')) return
    const s = document.createElement('style')
    s.id = 'crm-styles'
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: ${F}; background: ${LGRAY}; }
      .crm-input {
        width:100%; padding:10px 13px; background:${WHITE}; border:1.5px solid ${BORDER};
        border-radius:10px; font-size:14px; font-family:inherit; color:${DARK};
        outline:none; transition:border-color .15s, box-shadow .15s;
      }
      .crm-input:focus { border-color:${TEAL}; box-shadow:0 0 0 3px rgba(15,118,110,.1); }
      .crm-select { appearance:none; -webkit-appearance:none; cursor:pointer; }
      .crm-btn {
        padding:9px 18px; border:none; border-radius:10px; font-size:13px;
        font-weight:600; font-family:inherit; cursor:pointer; transition:all .15s;
      }
      .crm-btn-primary { background:${TEAL}; color:white; }
      .crm-btn-primary:hover { background:#0D6560; transform:translateY(-1px); }
      .crm-btn-ghost { background:${LGRAY}; color:${DARK}; }
      .crm-btn-ghost:hover { background:#EBEBF0; }
      .crm-btn-danger { background:#FFF1F2; color:#BE123C; border:1.5px solid #FECDD3; }
      .crm-btn-danger:hover { background:#FFE4E6; }
      .nav-item {
        display:flex; align-items:center; gap:11px; padding:10px 14px;
        border-radius:10px; cursor:pointer; transition:all .15s;
        color:rgba(255,255,255,.55); font-size:14px; font-weight:500;
        border:none; background:none; font-family:inherit; width:100%; text-align:right;
      }
      .nav-item:hover { background:rgba(255,255,255,.07); color:rgba(255,255,255,.85); }
      .nav-item.active { background:rgba(15,118,110,.25); color:#5EEAD4; }
      .crm-table { width:100%; border-collapse:collapse; font-size:13px; }
      .crm-table th { padding:10px 14px; text-align:right; font-weight:700; color:${GRAY};
        font-size:11px; letter-spacing:.5px; text-transform:uppercase; background:${LGRAY};
        border-bottom:1.5px solid ${BORDER}; }
      .crm-table td { padding:12px 14px; border-bottom:1px solid #F3F4F6; color:${DARK}; vertical-align:middle; }
      .crm-table tr:hover td { background:#F9FAFB; }
      .crm-card { background:${WHITE}; border-radius:16px; border:1.5px solid #F3F4F6;
        box-shadow:0 1px 4px rgba(0,0,0,.05); }
      .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
      .tab-btn { padding:11px 16px; background:none; border:none; border-bottom:2px solid transparent;
        color:${GRAY}; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit;
        transition:all .15s; white-space:nowrap; }
      .tab-btn.active { border-bottom-color:${TEAL}; color:${TEAL}; font-weight:700; }
      .note-item { display:flex; gap:14px; padding:13px 16px; background:#FAFAFA;
        border:1.5px solid #F3F4F6; border-radius:11px; align-items:flex-start; margin-bottom:8px; }
      .drag-zone { border:2px dashed ${BORDER}; border-radius:14px; padding:32px;
        text-align:center; cursor:pointer; transition:all .2s; background:${LGRAY}; }
      .drag-zone:hover, .drag-zone.over { border-color:${TEAL}; background:rgba(15,118,110,.04); }
      .priority-urgent { background:#FFF1F2; color:#BE123C; }
      .priority-high    { background:#FFF7ED; color:#C2410C; }
      .priority-normal  { background:#F0FDF9; color:${TEAL}; }
      .priority-low     { background:${LGRAY}; color:${GRAY}; }
    `
    document.head.appendChild(s)
  }, [])
}

// ─── SMALL UI ─────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = STATUSES.find(x => x.v === status) || STATUSES[0]
  return <span className="badge" style={{ background:s.bg, color:s.fg }}>{s.he}</span>
}

const Card = ({ children, style }) => (
  <div className="crm-card" style={{ padding:20, ...style }}>{children}</div>
)

const SectionTitle = ({ children, action }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
    marginBottom:16, paddingBottom:13, borderBottom:`1.5px solid #F3F4F6` }}>
    <div style={{ fontSize:15, fontWeight:700, color:DARK, fontFamily:F }}>{children}</div>
    {action}
  </div>
)

function Inp({ label, value, onChange, type='text', placeholder, disabled, style }) {
  return (
    <div style={{ marginBottom:14, ...style }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>{label}</label>}
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder||''} disabled={disabled}
        className="crm-input" style={disabled?{opacity:.5,cursor:'not-allowed'}:{}} />
    </div>
  )
}

function Sel({ label, value, onChange, opts, placeholder, disabled }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        <select value={value||''} onChange={e=>onChange(e.target.value)} disabled={disabled}
          className="crm-input crm-select" style={{ paddingRight:13, paddingLeft:32 }}>
          <option value=''>{placeholder||'—'}</option>
          {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
        </select>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
          pointerEvents:'none', color:GRAY, fontSize:11 }}>▼</span>
      </div>
    </div>
  )
}

// ─── NOTES WIDGET ─────────────────────────────────────────────────────────────
function NotesWidget({ notes, loading, onAdd, onDelete, currentUser }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div>
      {/* Add note */}
      <div style={{ background:'#F8FAFF', border:'1.5px solid #E0E7FF', borderRadius:12, padding:16, marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:10, marginBottom:10 }}>
          <Inp label="תאריך" type="date" value={date} onChange={setDate} />
          <Inp label="תרשומת" value={text} onChange={setText} placeholder="הוסף תרשומת..." />
        </div>
        <button className="crm-btn crm-btn-primary" style={{ width:'100%' }}
          onClick={async()=>{ if(!text.trim()) return; await onAdd({text:text.trim(),note_date:date,created_by:currentUser}); setText(''); setDate(new Date().toISOString().split('T')[0]) }}>
          + הוסף תרשומת
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', color:GRAY, padding:24 }}>טוען...</div>
      : notes.length === 0 ? <div style={{ textAlign:'center', color:'#D1D5DB', padding:24 }}>אין תרשומות עדיין</div>
      : notes.map(n => (
        <div key={n.id} className="note-item">
          <div style={{ flexShrink:0, background:WHITE, border:'1.5px solid #E5E7EB', borderRadius:9, padding:'6px 10px', textAlign:'center', minWidth:70 }}>
            <div style={{ fontSize:11, color:GRAY }}>{new Date(n.note_date).toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'})}</div>
            <div style={{ fontSize:12, fontWeight:700, color:DARK }}>{new Date(n.note_date).getFullYear()}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:DARK, lineHeight:1.7, direction:'rtl' }}>{n.text}</div>
            {n.created_by && <div style={{ fontSize:11, color:GRAY, marginTop:3 }}>👤 {n.created_by}</div>}
          </div>
          <button onClick={()=>onDelete(n.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#FCA5A5', fontSize:15, padding:'2px 4px' }}
            onMouseEnter={e=>e.currentTarget.style.color='#EF4444'} onMouseLeave={e=>e.currentTarget.style.color='#FCA5A5'}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── CANDIDATE (WORKER) CARD ──────────────────────────────────────────────────
function WorkerCard({ candidate, onUpdate, onDelete, onBack, currentUser }) {
  const [tab, setTab]       = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm]     = useState({...candidate})
  const [notes, setNotes]   = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRefs = useRef({})

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const name = candidate.full_name_he || candidate.full_name_en || '—'

  useEffect(()=>{
    if(tab==='notes') {
      fetchNotes(candidate.id).then(d=>{setNotes(d);setNotesLoading(false)}).catch(()=>setNotesLoading(false))
    }
  },[tab,candidate.id])

  const save = async () => {
    setSaving(true)
    const changes = {
      full_name_he:form.full_name_he, full_name_en:form.full_name_en,
      phone:form.phone, email:form.email, dob:form.dob||null,
      country:form.country, city:form.city, sector:form.sector,
      profession:form.profession, experience:form.experience,
      permit_type:form.permit_type, permit_number:form.permit_number,
      permit_expiry:form.permit_expiry||null, entry_date:form.entry_date||null,
      current_employer:form.current_employer, last_employer:form.last_employer,
      placement:form.placement, placement_date:form.placement_date||null,
      placement_notes:form.placement_notes, status:form.status,
    }
    await onUpdate(candidate.id, changes)
    setSaving(false); setEditMode(false)
  }

  const INP_S = { padding:'10px 13px', background:LGRAY, border:`1.5px solid ${BORDER}`, borderRadius:10, color:DARK, fontFamily:F, fontSize:13, outline:'none', width:'100%' }

  const row = (icon, label, val, danger) => val ? (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid #F9FAFB` }}>
      <span style={{ fontSize:12, color:GRAY }}>{icon} {label}</span>
      <span style={{ fontSize:13, color:danger?'#DC2626':DARK, fontWeight:500, textAlign:'right', maxWidth:240, wordBreak:'break-word' }}>{val}</span>
    </div>
  ) : null

  return (
    <div style={{ fontFamily:F, minHeight:'calc(100vh - 62px)', background:LGRAY }}>
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:WHITE, borderRadius:16, padding:28, maxWidth:360, width:'90%', fontFamily:F }}>
            <div style={{ fontSize:40, textAlign:'center', marginBottom:14 }}>🗑️</div>
            <h3 style={{ fontSize:17, fontWeight:700, textAlign:'center', marginBottom:8 }}>מחיקת עובד</h3>
            <p style={{ fontSize:14, color:GRAY, textAlign:'center', lineHeight:1.6, marginBottom:22 }}>האם למחוק את <strong>{name}</strong>?<br/><span style={{fontSize:12,color:'#EF4444'}}>פעולה זו אינה הפיכה</span></p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="crm-btn crm-btn-ghost" style={{ flex:1 }} onClick={()=>setConfirmDel(false)}>ביטול</button>
              <button style={{ flex:1, padding:11, background:'#EF4444', color:WHITE, border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}
                onClick={async()=>{ await onDelete(candidate.id); onBack() }}>מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:WHITE, borderBottom:`1.5px solid #F3F4F6`, padding:'14px 24px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <button className="crm-btn crm-btn-ghost" onClick={onBack} style={{ fontSize:13 }}>← חזרה</button>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontSize:18, fontWeight:800, color:DARK }}>{name}</div>
          {candidate.full_name_en && candidate.full_name_he && <div style={{ fontSize:12, color:GRAY }}>{candidate.full_name_en}</div>}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <Badge status={form.status} />
          {STATUSES.filter(s=>s.v!==form.status).map(s=>(
            <button key={s.v} onClick={async()=>{ set('status',s.v); await onUpdate(candidate.id,{status:s.v}) }}
              style={{ padding:'4px 12px', borderRadius:20, border:`1.5px solid ${BORDER}`, background:WHITE, color:GRAY, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F }}>
              {s.he}
            </button>
          ))}
          {candidate.phone && <>
            <a href={`tel:${candidate.phone}`} className="crm-btn crm-btn-ghost" style={{ textDecoration:'none', fontSize:13 }}>📞</a>
            <a href={`https://wa.me/${candidate.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="crm-btn crm-btn-ghost" style={{ textDecoration:'none', fontSize:13 }}>💬 WA</a>
          </>}
          <button className="crm-btn crm-btn-danger" style={{ fontSize:12 }} onClick={()=>setConfirmDel(true)}>🗑️</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:WHITE, borderBottom:`1.5px solid #F3F4F6`, padding:'0 24px', display:'flex', gap:2, overflowX:'auto' }}>
        {[['info','📋 פרטים'],['placement','🏢 שיבוץ'],['docs','📁 מסמכים'],['notes','📝 תרשומות']].map(([k,l])=>(
          <button key={k} className={`tab-btn${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth:700, margin:'24px auto', padding:'0 20px 60px' }}>

        {/* INFO TAB */}
        {tab==='info' && (
          <Card>
            <SectionTitle action={
              <button className={`crm-btn ${editMode?'crm-btn-primary':'crm-btn-ghost'}`} onClick={()=>editMode?save():setEditMode(true)} style={{ fontSize:13 }}>
                {saving?'שומר...':editMode?'💾 שמור':'✏️ ערוך'}
              </button>
            }>פרטים אישיים ומקצועיים</SectionTitle>

            {editMode ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['שם עברית','full_name_he'],['שם אנגלית','full_name_en'],['טלפון','phone'],['אימייל','email'],['מדינה','country'],['עיר','city'],['ענף','sector'],['מקצוע','profession'],['ניסיון','experience'],['מעסיק נוכחי','current_employer'],['מעסיק אחרון','last_employer'],['מספר היתר','permit_number']].map(([label,k])=>(
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>{label}</label>
                    <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={INP_S} />
                  </div>
                ))}
                {[['תוקף ויזה','permit_expiry'],['כניסה לישראל','entry_date'],['ת.לידה','dob']].map(([label,k])=>(
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>{label}</label>
                    <input type="date" value={form[k]||''} onChange={e=>set(k,e.target.value)} style={INP_S} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {row('📱','טלפון',candidate.phone)}
                {row('📧','אימייל',candidate.email)}
                {row('🌍','מדינה',candidate.country?.split('/')[0]?.trim())}
                {row('📍','עיר',candidate.city?.split('/')[0]?.trim())}
                {row('🎂','ת.לידה',candidate.dob?fmtDate(candidate.dob):null)}
                {row('⚙️','ענף',SECTORS.find(s=>s.v===candidate.sector)?.he)}
                {row('🔧','מקצוע',candidate.profession?.split('/')[0]?.trim())}
                {row('📅','ניסיון',candidate.experience?`${candidate.experience} שנים`:null)}
                {row('🏢','מעסיק נוכחי',candidate.current_employer)}
                {row('🏛️','מעסיק אחרון',candidate.last_employer)}
                {row('🪪','ויזה',PERMITS.find(p=>p.v===candidate.permit_type)?.l)}
                {row('🔢','מספר היתר',candidate.permit_number)}
                {candidate.entry_date && row('✈️','כניסה לישראל',fmtDate(candidate.entry_date))}
                {candidate.permit_expiry && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
                    <span style={{ fontSize:12, color:GRAY }}>⏱ תוקף ויזה</span>
                    <span style={{ fontSize:13, fontWeight:600, color:isExpired(candidate.permit_expiry)?'#DC2626':isSoon(candidate.permit_expiry)?'#D97706':DARK }}>
                      {fmtDate(candidate.permit_expiry)} {isExpired(candidate.permit_expiry)?'🔴 פג':isSoon(candidate.permit_expiry)?'🟡 קרוב':''}
                    </span>
                  </div>
                )}
                <div style={{ marginTop:12, fontSize:11, color:'#D1D5DB', textAlign:'center' }}>נרשם {fmtDate(candidate.created_at)} · #{candidate.id.slice(0,8)}</div>
              </div>
            )}
          </Card>
        )}

        {/* PLACEMENT TAB */}
        {tab==='placement' && (
          <Card>
            <SectionTitle>🏢 שיבוץ</SectionTitle>
            {candidate.placement && (
              <div style={{ background:'#F0FDF9', border:`1.5px solid #CCFBF1`, borderRadius:12, padding:'13px 16px', marginBottom:18 }}>
                <div style={{ fontSize:11, color:TEAL, fontWeight:700, marginBottom:3, letterSpacing:'.5px', textTransform:'uppercase' }}>שיבוץ נוכחי</div>
                <div style={{ fontSize:16, fontWeight:700, color:DARK }}>{candidate.placement}</div>
                {candidate.placement_date && <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>מתאריך: {fmtDate(candidate.placement_date)}</div>}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Inp label="מקום עבודה" value={form.placement} onChange={v=>set('placement',v)} placeholder="שם החברה / מקום העבודה" />
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>תאריך שיבוץ</label>
                <input type="date" value={form.placement_date||''} onChange={e=>set('placement_date',e.target.value)} className="crm-input" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>הערות</label>
                <textarea value={form.placement_notes||''} onChange={e=>set('placement_notes',e.target.value)} rows={3}
                  className="crm-input" style={{ resize:'vertical', lineHeight:1.6 }} />
              </div>
              <button className="crm-btn crm-btn-primary" onClick={async()=>{ setSaving(true); await onUpdate(candidate.id,{placement:form.placement,placement_date:form.placement_date||null,placement_notes:form.placement_notes}); setSaving(false); alert('שיבוץ נשמר') }}>
                {saving?'שומר...':'💾 שמור שיבוץ'}
              </button>
            </div>
          </Card>
        )}

        {/* DOCS TAB */}
        {tab==='docs' && (
          <Card>
            <SectionTitle>📁 מסמכים</SectionTitle>
            {DOC_FIELDS.map(d=>{
              const hasDoc = candidate[`doc_${d.k}`]
              return (
                <div key={d.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', marginBottom:8, background:LGRAY, borderRadius:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:DARK }}>{d.he}</div>
                    <div style={{ fontSize:11, color:GRAY }}>{d.en}</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {hasDoc
                      ? <button className="crm-btn crm-btn-ghost" style={{ fontSize:12 }} onClick={async()=>{ const url=await getDocUrl(candidate.id,d.k); if(url) window.open(url,'_blank'); else alert('לא נמצא') }}>👁 צפה</button>
                      : <span style={{ fontSize:11, color:'#D1D5DB' }}>לא הועלה</span>}
                    <button className="crm-btn crm-btn-ghost" style={{ fontSize:12 }} onClick={()=>fileRefs.current[d.k]?.click()}>
                      {hasDoc?'🔄 החלף':'📎 העלה'}
                    </button>
                    <input ref={el=>fileRefs.current[d.k]=el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
                      onChange={async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; await uploadDoc(candidate.id,d.k,f); await onUpdate(candidate.id,{[`doc_${d.k}`]:true}); alert('הועלה') }} />
                  </div>
                </div>
              )
            })}
          </Card>
        )}

        {/* NOTES TAB */}
        {tab==='notes' && (
          <Card>
            <SectionTitle>📝 תרשומות ומעקב</SectionTitle>
            <NotesWidget
              notes={notes} loading={notesLoading} currentUser={currentUser}
              onAdd={async(fields)=>{ const n=await insertNote({candidate_id:candidate.id,...fields}); setNotes(p=>[n,...p]) }}
              onDelete={async(id)=>{ await deleteNote(id); setNotes(p=>p.filter(n=>n.id!==id)) }}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── APARTMENTS MODULE ────────────────────────────────────────────────────────
function ApartmentsModule({ candidates, currentUser }) {
  const [apts, setApts]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('list') // list | card
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editApt, setEditApt]   = useState(null)
  const [search, setSearch]     = useState('')
  const [notes, setNotes]       = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [residents, setResidents] = useState([])
  const [tab, setTab]           = useState('info')
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    try {
      const { data } = await supabase.from('apartments').select('*').order('created_at',{ascending:false})
      setApts(data||[])
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  useEffect(()=>{
    if(!selected) return
    setNotesLoading(true)
    supabase.from('apartment_notes').select('*').eq('apartment_id',selected.id).order('note_date',{ascending:false})
      .then(({data})=>{ setNotes(data||[]); setNotesLoading(false) })
    supabase.from('apartment_residents').select('*,candidates(full_name_he,full_name_en,phone,sector)').eq('apartment_id',selected.id)
      .then(({data})=>setResidents(data||[]))
  },[selected, tab])

  const saveApt = async (f) => {
    if (editApt) {
      await supabase.from('apartments').update(f).eq('id',editApt.id)
      setApts(p=>p.map(a=>a.id===editApt.id?{...a,...f}:a))
      if(selected?.id===editApt.id) setSelected(s=>({...s,...f}))
    } else {
      const {data} = await supabase.from('apartments').insert([f]).select().single()
      setApts(p=>[data,...p])
    }
    setShowForm(false); setEditApt(null)
  }

  const deleteApt = async (id) => {
    await supabase.from('apartments').delete().eq('id',id)
    setApts(p=>p.filter(a=>a.id!==id))
    if(selected?.id===id) setSelected(null)
  }

  const addResident = async (candidateId, moveIn) => {
    const {data} = await supabase.from('apartment_residents').insert([{apartment_id:selected.id,candidate_id:candidateId,move_in_date:moveIn||null}]).select('*,candidates(full_name_he,full_name_en,phone,sector)').single()
    setResidents(p=>[...p,data])
  }

  const removeResident = async (id) => {
    await supabase.from('apartment_residents').delete().eq('id',id)
    setResidents(p=>p.filter(r=>r.id!==id))
  }

  const filtered = apts.filter(a=>{
    const q = search.toLowerCase()
    return !q || [a.address,a.city,a.owner_name].some(v=>(v||'').toLowerCase().includes(q))
  })

  // ── APARTMENT FORM ──
  if (showForm) {
    const f = editApt || {}
    const [lf, setLf] = useState({address:f.address||'',city:f.city||'',floor:f.floor||'',rooms:f.rooms||'',owner_name:f.owner_name||'',owner_phone:f.owner_phone||'',rent_amount:f.rent_amount||'',start_date:f.start_date||'',end_date:f.end_date||'',meter_electric:f.meter_electric||'',meter_water:f.meter_water||'',meter_gas:f.meter_gas||''})
    const sl = (k,v) => setLf(p=>({...p,[k]:v}))
    return (
      <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 20px' }}>
        <Card>
          <SectionTitle action={<button className="crm-btn crm-btn-ghost" onClick={()=>{setShowForm(false);setEditApt(null)}}>ביטול</button>}>
            {editApt?'עריכת דירה':'דירה חדשה'}
          </SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}><Inp label="כתובת *" value={lf.address} onChange={v=>sl('address',v)} /></div>
            <Inp label="עיר" value={lf.city} onChange={v=>sl('city',v)} />
            <Inp label="קומה" value={lf.floor} onChange={v=>sl('floor',v)} />
            <Inp label="חדרים" value={lf.rooms} onChange={v=>sl('rooms',v)} type="number" />
            <Inp label="שכ״ד (₪)" value={lf.rent_amount} onChange={v=>sl('rent_amount',v)} type="number" />
            <Inp label="שם בעל דירה" value={lf.owner_name} onChange={v=>sl('owner_name',v)} />
            <Inp label="טלפון בעל דירה" value={lf.owner_phone} onChange={v=>sl('owner_phone',v)} />
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>תחילת חוזה</label>
              <input type="date" value={lf.start_date} onChange={e=>sl('start_date',e.target.value)} className="crm-input" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>סיום חוזה</label>
              <input type="date" value={lf.end_date} onChange={e=>sl('end_date',e.target.value)} className="crm-input" />
            </div>
            <Inp label="מונה חשמל" value={lf.meter_electric} onChange={v=>sl('meter_electric',v)} />
            <Inp label="מונה מים" value={lf.meter_water} onChange={v=>sl('meter_water',v)} />
            <Inp label="מונה גז" value={lf.meter_gas} onChange={v=>sl('meter_gas',v)} />
          </div>
          <button className="crm-btn crm-btn-primary" style={{ width:'100%', marginTop:16 }} onClick={()=>saveApt(lf)}>
            {editApt?'💾 שמור':'+ הוסף דירה'}
          </button>
        </Card>
      </div>
    )
  }

  // ── APARTMENT DETAIL ──
  if (selected) {
    const apt = selected
    return (
      <div style={{ fontFamily:F, background:LGRAY, minHeight:'calc(100vh - 62px)' }}>
        <div style={{ background:WHITE, borderBottom:`1.5px solid #F3F4F6`, padding:'14px 24px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <button className="crm-btn crm-btn-ghost" onClick={()=>setSelected(null)}>← חזרה</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:DARK }}>🏠 {apt.address}</div>
            <div style={{ fontSize:12, color:GRAY }}>{apt.city} {apt.floor&&`· קומה ${apt.floor}`} {apt.rooms&&`· ${apt.rooms} חדרים`}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {apt.owner_phone && <a href={`tel:${apt.owner_phone}`} className="crm-btn crm-btn-ghost" style={{ textDecoration:'none', fontSize:13 }}>📞 בעל דירה</a>}
            <button className="crm-btn crm-btn-ghost" style={{ fontSize:13 }} onClick={()=>{setEditApt(apt);setShowForm(true)}}>✏️ ערוך</button>
            <button className="crm-btn crm-btn-danger" style={{ fontSize:12 }} onClick={()=>{ if(window.confirm('למחוק?')) deleteApt(apt.id) }}>🗑️</button>
          </div>
        </div>

        <div style={{ background:WHITE, borderBottom:`1.5px solid #F3F4F6`, padding:'0 24px', display:'flex', gap:2, overflowX:'auto' }}>
          {[['info','📋 פרטים'],[`residents`,`👥 דיירים (${residents.length})`],['notes','📝 תרשומות']].map(([k,l])=>(
            <button key={k} className={`tab-btn${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ maxWidth:700, margin:'24px auto', padding:'0 20px 60px' }}>
          {tab==='info' && (
            <Card>
              <SectionTitle>פרטי הדירה</SectionTitle>
              {[[`📍`,`כתובת`,`${apt.address}${apt.city?', '+apt.city:''}`],[`🏠`,`קומה`,apt.floor],[`🛏`,`חדרים`,apt.rooms],[`💰`,`שכ"ד`,apt.rent_amount?`₪${apt.rent_amount}`:null],[`👤`,`בעל דירה`,apt.owner_name],[`📞`,`טלפון`,apt.owner_phone],[`📅`,`תחילת חוזה`,apt.start_date?fmtDate(apt.start_date):null],[`📅`,`סיום חוזה`,apt.end_date?fmtDate(apt.end_date):null],[`⚡`,`מונה חשמל`,apt.meter_electric],[`💧`,`מונה מים`,apt.meter_water],[`🔥`,`מונה גז`,apt.meter_gas]].map(([icon,label,val])=>val?(
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
                  <span style={{ fontSize:12, color:GRAY }}>{icon} {label}</span>
                  <span style={{ fontSize:13, color:DARK, fontWeight:500 }}>{val}</span>
                </div>
              ):null)}
            </Card>
          )}

          {tab==='residents' && (
            <Card>
              <SectionTitle action={
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <select className="crm-input crm-select" style={{ minWidth:180, fontSize:13 }}
                    onChange={e=>{ if(e.target.value) addResident(e.target.value,''); e.target.value='' }}>
                    <option value=''>+ הוסף דייר</option>
                    {candidates.filter(c=>!residents.find(r=>r.candidate_id===c.id)).map(c=>(
                      <option key={c.id} value={c.id}>{c.full_name_he||c.full_name_en}</option>
                    ))}
                  </select>
                </div>
              }>👥 דיירים ({residents.length})</SectionTitle>
              {residents.length===0
                ? <div style={{ textAlign:'center', padding:40, color:'#D1D5DB' }}>אין דיירים משויכים</div>
                : residents.map(r=>(
                  <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', background:LGRAY, borderRadius:10, marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:DARK }}>{r.candidates?.full_name_he||r.candidates?.full_name_en}</div>
                      <div style={{ fontSize:11, color:GRAY }}>{r.candidates?.phone} {r.move_in_date&&`· נכנס ${fmtDate(r.move_in_date)}`}</div>
                    </div>
                    <button onClick={()=>removeResident(r.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#FCA5A5', fontSize:14 }}
                      onMouseEnter={e=>e.currentTarget.style.color='#EF4444'} onMouseLeave={e=>e.currentTarget.style.color='#FCA5A5'}>✕</button>
                  </div>
                ))}
            </Card>
          )}

          {tab==='notes' && (
            <Card>
              <SectionTitle>📝 תרשומות</SectionTitle>
              <NotesWidget
                notes={notes} loading={notesLoading} currentUser={currentUser}
                onAdd={async(fields)=>{
                  const {data} = await supabase.from('apartment_notes').insert([{apartment_id:apt.id,...fields}]).select().single()
                  setNotes(p=>[data,...p])
                }}
                onDelete={async(id)=>{ await supabase.from('apartment_notes').delete().eq('id',id); setNotes(p=>p.filter(n=>n.id!==id)) }}
              />
            </Card>
          )}
        </div>
      </div>
    )
  }

  // ── APARTMENT LIST ──
  return (
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:DARK }}>🏠 דירות ({filtered.length})</div>
        <div style={{ display:'flex', gap:10 }}>
          <input placeholder="🔍 חיפוש..." value={search} onChange={e=>setSearch(e.target.value)}
            className="crm-input" style={{ minWidth:200, fontSize:13 }} />
          <button className="crm-btn crm-btn-primary" onClick={()=>{setEditApt(null);setShowForm(true)}}>+ דירה חדשה</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:GRAY }}>טוען...</div>
      : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏠</div>
          <div style={{ fontSize:16, fontWeight:700, color:DARK, marginBottom:8 }}>אין דירות עדיין</div>
          <button className="crm-btn crm-btn-primary" onClick={()=>{setEditApt(null);setShowForm(true)}}>+ הוסף דירה ראשונה</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {filtered.map(a=>{
            const resCount = candidates.filter(c=>c.apartment_id===a.id).length
            return (
              <div key={a.id} onClick={()=>{setSelected(a);setTab('info')}}
                className="crm-card" style={{ padding:18, cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏠</div>
                  <span className="badge" style={{ background:a.status==='active'?'#F0FDF9':'#F9FAFB', color:a.status==='active'?TEAL:GRAY }}>
                    {a.status==='active'?'● פעיל':'○ לא פעיל'}
                  </span>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:DARK, marginBottom:3 }}>{a.address}</div>
                {a.city && <div style={{ fontSize:12, color:GRAY, marginBottom:8 }}>📍 {a.city}{a.floor&&` · קומה ${a.floor}`}</div>}
                <div style={{ fontSize:12, color:GRAY, display:'flex', flexDirection:'column', gap:2 }}>
                  {a.owner_name && <span>👤 {a.owner_name}</span>}
                  {a.owner_phone && <span>📞 {a.owner_phone}</span>}
                  {a.rent_amount && <span>💰 ₪{a.rent_amount}/חודש</span>}
                </div>
                {a.end_date && (
                  <div style={{ marginTop:10, padding:'6px 10px', background:isExpired(a.end_date)?'#FFF1F2':isSoon(a.end_date)?'#FFFBEB':'#F0FDF9', borderRadius:8, fontSize:12, color:isExpired(a.end_date)?'#DC2626':isSoon(a.end_date)?'#D97706':TEAL, fontWeight:600 }}>
                    📅 חוזה עד {fmtDate(a.end_date)} {isExpired(a.end_date)?'🔴':isSoon(a.end_date)?'🟡':''}
                  </div>
                )}
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
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [newForm, setNewForm]       = useState({ name:'', description:'', category:'general', content:'' })
  const fileRef = useRef()

  useEffect(()=>{
    supabase.from('document_templates').select('*').order('created_at',{ascending:false})
      .then(({data})=>{ setTemplates(data||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[])

  const handleFile = async (file) => {
    if(!file) return
    setUploading(true)
    try {
      const path = `${Date.now()}_${file.name}`
      await supabase.storage.from('document-templates').upload(path, file)
      const { data } = await supabase.from('document_templates').insert([{
        name: file.name.replace(/\.[^.]+$/,''),
        description: `הועלה ${new Date().toLocaleDateString('he-IL')}`,
        file_path: path, created_by: currentUser, category: 'uploaded'
      }]).select().single()
      setTemplates(p=>[data,...p])
    } catch(e){ alert('שגיאה בהעלאה') }
    finally { setUploading(false) }
  }

  const saveTemplate = async () => {
    const {data} = await supabase.from('document_templates').insert([{...newForm, created_by:currentUser}]).select().single()
    setTemplates(p=>[data,...p])
    setShowNew(false); setNewForm({name:'',description:'',category:'general',content:''})
  }

  const deleteTemplate = async (id) => {
    await supabase.from('document_templates').delete().eq('id',id)
    setTemplates(p=>p.filter(t=>t.id!==id))
    if(selected?.id===id) setSelected(null)
  }

  const CATS = { general:'📄 כללי', contract:'📝 חוזה', report:'📊 דוח', letter:'✉️ מכתב', uploaded:'📎 הועלה' }

  if (selected) {
    const [editContent, setEditContent] = useState(selected.content||'')
    const [editName, setEditName] = useState(selected.name)
    const [saving, setSaving] = useState(false)

    const save = async () => {
      setSaving(true)
      await supabase.from('document_templates').update({name:editName, content:editContent}).eq('id',selected.id)
      setTemplates(p=>p.map(t=>t.id===selected.id?{...t,name:editName,content:editContent}:t))
      setSaving(false); alert('נשמר')
    }

    return (
      <div style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <button className="crm-btn crm-btn-ghost" onClick={()=>setSelected(null)}>← חזרה</button>
          <div style={{ fontSize:16, fontWeight:700, color:DARK, flex:1 }}>{selected.name}</div>
          <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving}>{saving?'שומר...':'💾 שמור'}</button>
          <button className="crm-btn crm-btn-ghost" onClick={()=>window.print()}>🖨️ הדפס</button>
          <button className="crm-btn crm-btn-danger" onClick={()=>{ if(window.confirm('למחוק?')) deleteTemplate(selected.id) }}>🗑️</button>
        </div>
        <Card>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>שם המסמך</label>
            <input value={editName} onChange={e=>setEditName(e.target.value)} className="crm-input" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>תוכן המסמך</label>
            <textarea value={editContent} onChange={e=>setEditContent(e.target.value)} rows={20}
              className="crm-input" style={{ resize:'vertical', lineHeight:1.8, fontSize:14, fontFamily:F }}
              placeholder="הזן את תוכן המסמך כאן..." />
          </div>
          <div style={{ marginTop:14, padding:'12px 14px', background:'#F0FDF9', border:`1px solid #CCFBF1`, borderRadius:10, fontSize:13, color:TEAL, lineHeight:1.7 }}>
            💡 טיפ: השתמש בתגיות כגון <strong>{'{{שם_עובד}}'}</strong>, <strong>{'{{תאריך}}'}</strong>, <strong>{'{{מעסיק}}'}</strong> — תגיות אלה יוחלפו אוטומטית בעת הפקת המסמך.
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:700, color:DARK }}>📋 מסמכים ותבניות</div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="crm-btn crm-btn-ghost" onClick={()=>fileRef.current.click()} disabled={uploading}>
            {uploading?'מעלה...':'📎 העלה קובץ'}
          </button>
          <button className="crm-btn crm-btn-primary" onClick={()=>setShowNew(true)}>+ תבנית חדשה</button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display:'none' }}
            onChange={e=>{ handleFile(e.target.files[0]); e.target.value='' }} />
        </div>
      </div>

      {/* Drag & Drop zone */}
      <div
        className={`drag-zone${isDragging?' over':''}`}
        style={{ marginBottom:24 }}
        onDragOver={e=>{ e.preventDefault(); setIsDragging(true) }}
        onDragLeave={()=>setIsDragging(false)}
        onDrop={e=>{ e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={()=>fileRef.current.click()}>
        <div style={{ fontSize:36, marginBottom:10 }}>📂</div>
        <div style={{ fontSize:15, fontWeight:600, color:isDragging?TEAL:DARK, marginBottom:4 }}>גרור קובץ לכאן</div>
        <div style={{ fontSize:13, color:GRAY }}>או לחץ לבחירת קובץ · PDF, Word, TXT</div>
      </div>

      {/* New template form */}
      {showNew && (
        <Card style={{ marginBottom:20 }}>
          <SectionTitle action={<button className="crm-btn crm-btn-ghost" onClick={()=>setShowNew(false)}>ביטול</button>}>תבנית חדשה</SectionTitle>
          <Inp label="שם התבנית" value={newForm.name} onChange={v=>setNewForm(p=>({...p,name:v}))} />
          <Inp label="תיאור" value={newForm.description} onChange={v=>setNewForm(p=>({...p,description:v}))} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>קטגוריה</label>
            <select value={newForm.category} onChange={e=>setNewForm(p=>({...p,category:e.target.value}))} className="crm-input crm-select">
              {Object.entries(CATS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:5 }}>תוכן ראשוני</label>
            <textarea value={newForm.content} onChange={e=>setNewForm(p=>({...p,content:e.target.value}))} rows={6}
              className="crm-input" style={{ resize:'vertical', lineHeight:1.7 }} placeholder="הזן תוכן..." />
          </div>
          <button className="crm-btn crm-btn-primary" style={{ width:'100%' }} onClick={saveTemplate}>+ צור תבנית</button>
        </Card>
      )}

      {loading ? <div style={{ textAlign:'center', padding:60, color:GRAY }}>טוען...</div>
      : templates.length===0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:700, color:DARK, marginBottom:8 }}>אין מסמכים עדיין</div>
          <div style={{ fontSize:14, color:GRAY }}>העלה קובץ או צור תבנית חדשה</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {templates.map(t=>(
            <div key={t.id} onClick={()=>setSelected(t)}
              className="crm-card" style={{ padding:18, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.file_path?'📎':'📄'}</div>
              <div style={{ fontSize:14, fontWeight:700, color:DARK, marginBottom:4 }}>{t.name}</div>
              {t.description && <div style={{ fontSize:12, color:GRAY, marginBottom:8 }}>{t.description}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, background:LGRAY, color:GRAY, padding:'2px 9px', borderRadius:20 }}>
                  {CATS[t.category]||'📄'}
                </span>
                <span style={{ fontSize:11, color:GRAY }}>{t.created_by}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TASKS MODULE ─────────────────────────────────────────────────────────────
function TasksModule({ candidates, currentUser }) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterStatus, setFilterStatus]     = useState('open')
  const [filterPriority, setFilterPriority] = useState('')
  const [form, setForm] = useState({ title:'', description:'', assigned_to:'', candidate_id:'', due_date:'', priority:'normal', created_by:currentUser })

  useEffect(()=>{
    fetchTasks().then(d=>{setTasks(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const add = async () => {
    if(!form.title.trim()) return
    const t = await insertTask({ ...form, status:'open', created_by:currentUser })
    setTasks(p=>[t,...p]); setShowForm(false)
    setForm({title:'',description:'',assigned_to:'',candidate_id:'',due_date:'',priority:'normal',created_by:currentUser})
  }

  const toggle = async (task) => {
    const s = task.status==='open'?'done':'open'
    await updateTask(task.id, { status:s, completed_at: s==='done' ? new Date().toISOString() : null })
    setTasks(p=>p.map(t=>t.id===task.id?{...t,status:s}:t))
  }

  const remove = async (id) => {
    await deleteTask(id); setTasks(p=>p.filter(t=>t.id!==id))
  }

  const filtered = tasks.filter(t=>(
    (!filterAssignee || t.assigned_to===filterAssignee) &&
    (!filterStatus   || t.status===filterStatus) &&
    (!filterPriority || t.priority===filterPriority)
  ))

  const PRIORITY_LABELS = { urgent:'🔴 דחוף', high:'🟠 גבוה', normal:'🟢 רגיל', low:'⚪ נמוך' }
  const open = tasks.filter(t=>t.status==='open').length
  const done = tasks.filter(t=>t.status==='done').length

  const INP_S = { padding:'10px 13px', background:LGRAY, border:`1.5px solid ${BORDER}`, borderRadius:10, color:DARK, fontFamily:F, fontSize:13, outline:'none', width:'100%' }

  return (
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:16, fontWeight:700, color:DARK }}>✅ משימות</div>
          <span className="badge" style={{ background:'#FEF9C3', color:'#854D0E' }}>{open} פתוחות</span>
          <span className="badge" style={{ background:'#F0FDF4', color:'#166534' }}>{done} הושלמו</span>
        </div>
        <button className="crm-btn crm-btn-primary" onClick={()=>setShowForm(s=>!s)}>
          {showForm?'✕ סגור':'+ משימה חדשה'}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>כותרת *</label>
              <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="תאר את המשימה..." style={INP_S} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>מבצע</label>
              <select value={form.assigned_to} onChange={e=>set('assigned_to',e.target.value)} style={{ ...INP_S, cursor:'pointer', appearance:'none' }}>
                <option value=''>— בחר —</option>
                {STAFF.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>עדיפות</label>
              <select value={form.priority} onChange={e=>set('priority',e.target.value)} style={{ ...INP_S, cursor:'pointer', appearance:'none' }}>
                {Object.entries(PRIORITY_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>תאריך יעד</label>
              <input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} style={INP_S} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>שייך למועמד</label>
              <select value={form.candidate_id} onChange={e=>set('candidate_id',e.target.value)} style={{ ...INP_S, cursor:'pointer', appearance:'none' }}>
                <option value=''>— ללא שיוך —</option>
                {candidates.map(c=><option key={c.id} value={c.id}>{c.full_name_he||c.full_name_en||c.phone}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:GRAY, marginBottom:4 }}>פרטים</label>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
                style={{ ...INP_S, resize:'vertical', lineHeight:1.6 }} placeholder="פרטים נוספים..." />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="crm-btn crm-btn-primary" style={{ flex:1 }} onClick={add}>✓ הוסף משימה</button>
            <button className="crm-btn crm-btn-ghost" style={{ padding:'9px 18px' }} onClick={()=>setShowForm(false)}>ביטול</button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[['open','פתוחות'],['done','הושלמו'],['','הכל']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterStatus(v)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filterStatus===v?TEAL:BORDER}`, background:filterStatus===v?TEAL+'18':WHITE, color:filterStatus===v?TEAL:GRAY, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F }}>
            {l}
          </button>
        ))}
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}
          style={{ padding:'5px 12px', border:`1.5px solid ${BORDER}`, borderRadius:20, fontSize:12, color:GRAY, fontFamily:F, outline:'none', background:WHITE, cursor:'pointer', appearance:'none' }}>
          <option value=''>כל העדיפויות</option>
          {Object.entries(PRIORITY_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}
          style={{ padding:'5px 12px', border:`1.5px solid ${BORDER}`, borderRadius:20, fontSize:12, color:GRAY, fontFamily:F, outline:'none', background:WHITE, cursor:'pointer', appearance:'none' }}>
          <option value=''>כל הנציגים</option>
          {STAFF.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40, color:GRAY }}>טוען...</div>
      : filtered.length===0 ? <div style={{ textAlign:'center', padding:40, color:'#D1D5DB' }}>אין משימות</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(t=>{
            const cand = candidates.find(c=>c.id===t.candidate_id)
            const done = t.status==='done'
            const over = t.due_date && new Date(t.due_date)<new Date() && !done
            return (
              <div key={t.id} className="crm-card" style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12, opacity:done?.7:1, borderColor:over?'#FECDD3':'#F3F4F6' }}>
                <button onClick={()=>toggle(t)}
                  style={{ width:22, height:22, borderRadius:6, border:`2px solid ${done?TEAL:'#D1D5DB'}`, background:done?TEAL:WHITE, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1, transition:'all .15s' }}>
                  {done && <span style={{ color:WHITE, fontSize:12 }}>✓</span>}
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:done?400:600, color:done?GRAY:DARK, textDecoration:done?'line-through':'none', marginBottom:5 }}>
                    {t.title}
                  </div>
                  {t.description && <div style={{ fontSize:12, color:GRAY, lineHeight:1.6, marginBottom:6, direction:'rtl' }}>{t.description}</div>}
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
                    {t.priority && t.priority!=='normal' && (
                      <span className={`badge priority-${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span>
                    )}
                    {t.assigned_to && <span className="badge" style={{ background:'#EEF2FF', color:'#4F46E5' }}>👤 {t.assigned_to}</span>}
                    {t.created_by && <span style={{ fontSize:11, color:GRAY }}>הוזן ע"י {t.created_by}</span>}
                    {cand && <span className="badge" style={{ background:'#F0FDF9', color:TEAL }}>🔗 {cand.full_name_he||cand.full_name_en}</span>}
                    {t.due_date && (
                      <span style={{ fontSize:11, background:over?'#FFF1F2':LGRAY, color:over?'#BE123C':GRAY, padding:'2px 9px', borderRadius:20, fontWeight:over?700:400 }}>
                        📅 {new Date(t.due_date).toLocaleDateString('he-IL')} {over?'⚠️ עבר המועד':''}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={()=>remove(t.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#FCA5A5', fontSize:15, flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color='#EF4444'} onMouseLeave={e=>e.currentTarget.style.color='#FCA5A5'}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MAIN CRM ─────────────────────────────────────────────────────────────────
export default function CRM({ session, onLogout }) {
  useStyles()
  const [module, setModule]       = useState('candidates')
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch]       = useState('')
  const [filterSector, setSector] = useState('')
  const [filterStatus, setStatus] = useState('')
  const [currentUser, setCurrentUser] = useState('')

  const userEmail = session?.user?.email || ''

  useEffect(()=>{
    const name = STAFF.find(s => userEmail.includes(s.toLowerCase())) || userEmail.split('@')[0]
    setCurrentUser(name)
  },[userEmail])

  const load = useCallback(async()=>{
    try { const d=await fetchCandidates(); setCandidates(d) }
    catch(e){ console.error(e) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ load() },[load])

  const update = async(id,changes)=>{ await updateCandidate(id,changes); setCandidates(p=>p.map(c=>c.id===id?{...c,...changes}:c)) }
  const remove = async(id)=>{ await deleteCandidate(id); setCandidates(p=>p.filter(c=>c.id!==id)) }

  const filtered = candidates.filter(c=>{
    const q=search.toLowerCase()
    const ms=!q||[c.full_name_he,c.full_name_en,c.phone,c.permit_number,c.placement].some(v=>(v||'').toLowerCase().includes(q))
    return ms && (!filterSector||c.sector===filterSector) && (!filterStatus||c.status===filterStatus)
  })

  const NAV = [
    { k:'candidates', icon:'👥', label:'עובדים' },
    { k:'apartments', icon:'🏠', label:'דירות' },
    { k:'employers',  icon:'🏢', label:'מעסיקים' },
    { k:'tasks',      icon:'✅', label:'משימות' },
    { k:'documents',  icon:'📋', label:'מסמכים' },
  ]

  const selected = selectedId ? candidates.find(c=>c.id===selectedId) : null

  if (module==='candidates' && view==='worker' && selected) {
    return (
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:F }}>
        {/* Sidebar */}
        <div style={{ width:220, background:SIDEBAR, display:'flex', flexDirection:'column', flexShrink:0, padding:'16px 10px', gap:4, overflowY:'auto' }}>
          <div style={{ padding:'8px 14px', marginBottom:12 }}>
            <div style={{ color:WHITE, fontSize:15, fontWeight:800, letterSpacing:'-0.3px' }}>Oz Hadar CRM</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:11, marginTop:2 }}>{currentUser}</div>
          </div>
          {NAV.map(n=>(
            <button key={n.k} className={`nav-item${module===n.k?' active':''}`}
              onClick={()=>{ setModule(n.k); setView('list'); setSelectedId(null) }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <button onClick={onLogout} className="nav-item" style={{ marginBottom:8 }}>
            <span>🚪</span><span>התנתק</span>
          </button>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          <WorkerCard candidate={selected} onUpdate={update} onDelete={remove}
            onBack={()=>{ setView('list'); setSelectedId(null) }} currentUser={currentUser} />
        </div>
      </div>
    )
  }

  const TH = ({c}) => <th className="crm-table-th" style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, color:GRAY, fontSize:11, letterSpacing:'.5px', textTransform:'uppercase', background:LGRAY, borderBottom:`1.5px solid ${BORDER}`, whiteSpace:'nowrap' }}>{c}</th>

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:F }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:220, background:SIDEBAR, display:'flex', flexDirection:'column', flexShrink:0, padding:'16px 10px', gap:4, overflowY:'auto' }}>
        <div style={{ padding:'8px 14px', marginBottom:12 }}>
          <div style={{ color:WHITE, fontSize:15, fontWeight:800, letterSpacing:'-0.3px' }}>Oz Hadar CRM</div>
          <div style={{ color:'rgba(255,255,255,.4)', fontSize:11, marginTop:2 }}>{currentUser}</div>
        </div>
        {NAV.map(n=>(
          <button key={n.k} className={`nav-item${module===n.k?' active':''}`} onClick={()=>{ setModule(n.k); setView('list'); setSelectedId(null) }}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        {/* Stats */}
        <div style={{ padding:'12px 14px', background:SIDEBAR2, borderRadius:10, marginBottom:8 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6 }}>סיכום</div>
          <div style={{ color:WHITE, fontSize:13 }}>👥 {candidates.length} עובדים</div>
          <div style={{ color:WHITE, fontSize:13, marginTop:3 }}>🟡 {candidates.filter(c=>isSoon(c.permit_expiry)).length} ויזות פוקעות</div>
        </div>
        <button onClick={onLogout} className="nav-item" style={{ marginBottom:8 }}>
          <span>🚪</span><span>התנתק</span>
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, overflow:'auto', background:LGRAY }}>

        {/* Top bar */}
        <div style={{ background:WHITE, borderBottom:`1.5px solid ${BORDER}`, padding:'12px 24px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
          <div style={{ fontSize:15, fontWeight:700, color:DARK, flex:1 }}>
            {NAV.find(n=>n.k===module)?.icon} {NAV.find(n=>n.k===module)?.label}
          </div>
          {module==='candidates' && (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input placeholder="🔍 חיפוש..." value={search} onChange={e=>setSearch(e.target.value)}
                className="crm-input" style={{ minWidth:220, fontSize:13 }} />
              <select value={filterSector} onChange={e=>setSector(e.target.value)}
                className="crm-input crm-select" style={{ fontSize:13, minWidth:120 }}>
                <option value=''>כל הענפים</option>
                {SECTORS.map(s=><option key={s.v} value={s.v}>{s.he}</option>)}
              </select>
              <select value={filterStatus} onChange={e=>setStatus(e.target.value)}
                className="crm-input crm-select" style={{ fontSize:13, minWidth:110 }}>
                <option value=''>כל הסטטוסים</option>
                {STATUSES.map(s=><option key={s.v} value={s.v}>{s.he}</option>)}
              </select>
              <span style={{ fontSize:12, color:GRAY, whiteSpace:'nowrap' }}>{filtered.length} תוצאות</span>
              <button className="crm-btn crm-btn-ghost" style={{ fontSize:12 }} onClick={load}>↻ רענן</button>
            </div>
          )}
        </div>

        {/* ── CANDIDATES ── */}
        {module==='candidates' && (
          <div style={{ padding:'20px 24px' }}>
            {/* Status cards */}
            <div style={{ display:'flex', gap:10, marginBottom:18, overflowX:'auto' }}>
              {STATUSES.map(s=>{
                const cnt=candidates.filter(c=>c.status===s.v).length
                const active=filterStatus===s.v
                return (
                  <div key={s.v} onClick={()=>setStatus(active?'':s.v)}
                    style={{ minWidth:90, background:active?s.bg:WHITE, border:`1.5px solid ${active?s.fg:BORDER}`, borderRadius:12, padding:'12px 14px', textAlign:'center', cursor:'pointer', transition:'all .15s', boxShadow:'0 1px 4px rgba(0,0,0,.04)', flex:1 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:active?s.fg:DARK }}>{cnt}</div>
                    <div style={{ fontSize:11, color:active?s.fg:GRAY, fontWeight:600 }}>{s.he}</div>
                  </div>
                )
              })}
            </div>

            {loading ? <div style={{ textAlign:'center', padding:60, color:GRAY }}>טוען...</div> : (
              <div className="crm-card" style={{ overflow:'hidden' }}>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <TH c="שם"/><TH c="טלפון"/><TH c="מדינה"/><TH c="ענף"/><TH c="ויזה"/>
                      <TH c="תוקף"/><TH c="שיבוץ"/><TH c="סטטוס"/><TH c="נרשם"/><TH c=""/>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0 && (
                      <tr><td colSpan={10} style={{ textAlign:'center', padding:60, color:'#D1D5DB' }}>אין מועמדים תואמים</td></tr>
                    )}
                    {filtered.map(c=>{
                      const exp=isExpired(c.permit_expiry); const soon=isSoon(c.permit_expiry)
                      return (
                        <tr key={c.id} style={{ cursor:'pointer' }} onClick={()=>{ setSelectedId(c.id); setView('worker') }}>
                          <td style={{ fontWeight:700, direction:'rtl', whiteSpace:'nowrap' }}>{c.full_name_he||c.full_name_en||'—'}</td>
                          <td style={{ color:GRAY, direction:'ltr', whiteSpace:'nowrap' }}>{c.phone||'—'}</td>
                          <td style={{ color:GRAY, fontSize:12 }}>{(c.country||'—').split('/')[0].trim()}</td>
                          <td>{SECTORS.find(s=>s.v===c.sector)?.he||'—'}</td>
                          <td style={{ color:GRAY, fontSize:12 }}>{PERMITS.find(p=>p.v===c.permit_type)?.l||'—'}</td>
                          <td style={{ whiteSpace:'nowrap' }}>
                            <span style={{ color:exp?'#DC2626':soon?'#D97706':DARK, fontWeight:(exp||soon)?700:400 }}>
                              {c.permit_expiry?fmtDate(c.permit_expiry):'—'} {exp?'🔴':soon?'🟡':''}
                            </span>
                          </td>
                          <td style={{ color:c.placement?TEAL:'#D1D5DB', fontWeight:c.placement?600:400, fontSize:12 }}>{c.placement||'—'}</td>
                          <td><Badge status={c.status}/></td>
                          <td style={{ color:GRAY, fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(c.created_at)}</td>
                          <td onClick={e=>{ e.stopPropagation(); if(window.confirm(`למחוק?`)) remove(c.id) }}
                            style={{ cursor:'pointer', color:'#FCA5A5', fontSize:16, textAlign:'center' }}
                            onMouseEnter={e=>e.currentTarget.style.color='#EF4444'} onMouseLeave={e=>e.currentTarget.style.color='#FCA5A5'}>🗑️</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {module==='apartments' && <ApartmentsModule candidates={candidates} currentUser={currentUser} />}
        {module==='tasks'}      && <TasksModule      candidates={candidates} currentUser={currentUser} />}
        {module==='documents'}  && <DocumentsModule  candidates={candidates} currentUser={currentUser} />}
        {module==='employers'}  && (
          <div style={{ padding:40, textAlign:'center', color:GRAY }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏢</div>
            <div style={{ fontSize:16, fontWeight:700 }}>מודול מעסיקים</div>
            <div style={{ fontSize:13, marginTop:6 }}>ממשיך לפעול כרגיל — ראה קוד Employers.jsx</div>
          </div>
        )}
      </div>
    </div>
  )
}
