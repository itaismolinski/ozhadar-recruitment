import { useState, useEffect, useCallback } from 'react'
import { fetchCandidates, updateCandidate, getDocUrl } from '../lib/supabase.js'
import { SECTORS, PERMITS, STATUSES, DOC_FIELDS } from '../constants.js'

const fmtDate   = iso => iso ? new Date(iso).toLocaleDateString('he-IL') : '—'
const isExpired = d  => d && new Date(d) < new Date()
const isSoon    = d  => { if (!d) return false; const diff=(new Date(d)-new Date())/864e5; return diff>=0 && diff<45 }

function Badge({ status }) {
  const s = STATUSES.find(x=>x.v===status) || STATUSES[0]
  return <span style={{ background:s.bg, color:s.fg, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{s.he}</span>
}

function DetailPanel({ candidate, onUpdate, onClose }) {
  const [loadingDoc, setLoadingDoc] = useState(null)

  const viewDoc = async (field) => {
    setLoadingDoc(field)
    const url = await getDocUrl(candidate.id, field)
    setLoadingDoc(null)
    if (url) window.open(url, '_blank')
    else alert('מסמך לא נמצא')
  }

  const row = (icon, label, val, danger=false) => val ? (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'5px 0', borderBottom:'1px solid #F9FAFB' }}>
      <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap', paddingLeft:8 }}>{icon} {label}</span>
      <span style={{ fontSize:13, color:danger?'#DC2626':'#111827', fontWeight:500, textAlign:'right', direction:'rtl', wordBreak:'break-word', maxWidth:200 }}>{val}</span>
    </div>
  ) : null

  const expDanger = isExpired(candidate.permit_expiry) || isSoon(candidate.permit_expiry)

  return (
    <div style={{ width:340, borderLeft:'1px solid #E5E7EB', background:'white', overflowY:'auto', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'16px 18px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'#F8F9FF' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:'#1E1B4B', direction:'rtl' }}>{candidate.full_name_he || candidate.full_name_en || '—'}</div>
          {candidate.full_name_he && candidate.full_name_en && <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{candidate.full_name_en}</div>}
          <div style={{ marginTop:6 }}><Badge status={candidate.status} /></div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:18 }}>✕</button>
      </div>

      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Status buttons */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 }}>שנה סטטוס</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {STATUSES.map(s=>(
              <button key={s.v} onClick={()=>onUpdate(candidate.id,{status:s.v})}
                style={{ padding:'4px 11px', borderRadius:20, border:`1.5px solid ${candidate.status===s.v?s.fg:'#E5E7EB'}`, background:candidate.status===s.v?s.bg:'white', color:candidate.status===s.v?s.fg:'#9CA3AF', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {s.he}
              </button>
            ))}
          </div>
        </div>

        <hr style={{ border:'none', borderTop:'1px solid #F3F4F6' }} />

        {/* Info rows */}
        <div>
          {row('📱','טלפון',       candidate.phone)}
          {row('📧','אימייל',      candidate.email)}
          {row('🌍','מדינה',       candidate.country?.split('/')[0]?.trim())}
          {row('🎂','ת.לידה',     candidate.dob ? fmtDate(candidate.dob) : null)}
          {row('📍','עיר מגורים', candidate.city?.split('/')[0]?.trim())}
          {row('⚙️','ענף',        SECTORS.find(s=>s.v===candidate.sector)?.he)}
          {row('🔧','מקצוע',      candidate.profession?.split('/')[0]?.trim())}
          {row('📅','ניסיון',     candidate.experience ? `${candidate.experience} שנים` : null)}
          {row('🏢','עבודה נוכחית', candidate.current_employer)}
          {row('🏛️','עבודה אחרונה', candidate.last_employer)}
          {row('🪪','ויזה',       PERMITS.find(p=>p.v===candidate.permit_type)?.l)}
          {row('🔢','מספר',       candidate.permit_number)}
          {row('✈️','כניסה לישראל', candidate.entry_date ? fmtDate(candidate.entry_date) : null)}
          {candidate.permit_expiry && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F9FAFB' }}>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>⏱ תוקף</span>
              <span style={{ fontSize:13, fontWeight:600, color:isExpired(candidate.permit_expiry)?'#DC2626':isSoon(candidate.permit_expiry)?'#D97706':'#111827' }}>
                {fmtDate(candidate.permit_expiry)} {isExpired(candidate.permit_expiry)?'🔴 פג':isSoon(candidate.permit_expiry)?'🟡':''}
              </span>
            </div>
          )}
        </div>

        <hr style={{ border:'none', borderTop:'1px solid #F3F4F6' }} />

        {/* Documents */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 }}>📁 מסמכים</div>
          {DOC_FIELDS.map(d => {
            const hasDoc = candidate[`doc_${d.k}`]
            return (
              <button key={d.k} onClick={() => hasDoc && viewDoc(d.k)} disabled={!hasDoc || loadingDoc===d.k}
                style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', marginBottom:6, background:hasDoc?'#FAFAFA':'#F3F4F6', border:'1px solid #F3F4F6', borderRadius:8, cursor:hasDoc?'pointer':'default', fontFamily:'inherit', opacity:hasDoc?1:.5 }}>
                <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{d.he}</span>
                <span style={{ fontSize:11, color:'#9CA3AF' }}>{!hasDoc ? 'לא הועלה' : loadingDoc===d.k ? 'טוען...' : 'צפה 👁'}</span>
              </button>
            )
          })}
        </div>

        <hr style={{ border:'none', borderTop:'1px solid #F3F4F6' }} />

        {/* Notes */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 }}>📝 הערות</div>
          <textarea value={candidate.notes||''} onChange={e=>onUpdate(candidate.id,{notes:e.target.value})} placeholder='הוסף הערות על המועמד...'
            rows={4} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, resize:'vertical', outline:'none', direction:'rtl', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }} />
        </div>

        <div style={{ fontSize:11, color:'#D1D5DB', textAlign:'center' }}>נרשם {fmtDate(candidate.created_at)}</div>
      </div>
    </div>
  )
}

export default function CRM() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [filterSector, setSector]   = useState('')
  const [filterStatus, setStatus]   = useState('')
  const [selected, setSelected]     = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchCandidates()
      setCandidates(data)
    } catch (e) {
      setError('שגיאה בטעינת נתונים: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = async (id, changes) => {
    try {
      await updateCandidate(id, changes)
      setCandidates(prev => prev.map(c => c.id===id ? {...c,...changes} : c))
    } catch (e) { alert('שגיאה בעדכון') }
  }

  const exportCSV = () => {
    const headers = ['שם עברית','שם אנגלית','טלפון','אימייל','מדינה','עיר','ענף','מקצוע','ניסיון','ויזה','מספר היתר','תוקף','כניסה לישראל','עבודה נוכחית','עבודה אחרונה','סטטוס','נרשם']
    const rows = candidates.map(c => [
      c.full_name_he, c.full_name_en, c.phone, c.email,
      c.country, c.city,
      SECTORS.find(s=>s.v===c.sector)?.he, c.profession, c.experience,
      PERMITS.find(p=>p.v===c.permit_type)?.l, c.permit_number,
      c.permit_expiry, c.entry_date,
      c.current_employer, c.last_employer,
      STATUSES.find(s=>s.v===c.status)?.he, fmtDate(c.created_at)
    ].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    const ms = !q || [c.full_name_he,c.full_name_en,c.phone,c.permit_number].some(v=>(v||'').toLowerCase().includes(q))
    return ms && (!filterSector || c.sector===filterSector) && (!filterStatus || c.status===filterStatus)
  })

  const candidate = selected ? candidates.find(c=>c.id===selected) : null

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 62px)',color:'#9CA3AF' }}>טוען נתונים...</div>
  if (error)   return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 62px)',color:'#DC2626' }}>{error}</div>

  const TH = ({c}) => <th style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, color:'#6B7280', fontSize:11, letterSpacing:'.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>{c}</th>

  return (
    <div style={{ display:'flex', height:'calc(100vh - 62px)', overflow:'hidden' }}>
      <div style={{ flex:1, overflow:'auto', padding:20, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <input placeholder='🔍  חיפוש שם / טלפון / מספר...' value={search} onChange={e=>setSearch(e.target.value)}
            style={{ flex:1, minWidth:200, padding:'9px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:14, outline:'none', fontFamily:'inherit' }} />
          <select value={filterSector} onChange={e=>setSector(e.target.value)}
            style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, background:'white', fontFamily:'inherit' }}>
            <option value=''>כל הענפים</option>
            {SECTORS.map(s=><option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setStatus(e.target.value)}
            style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, background:'white', fontFamily:'inherit' }}>
            <option value=''>כל הסטטוסים</option>
            {STATUSES.map(s=><option key={s.v} value={s.v}>{s.he}</option>)}
          </select>
          <button onClick={load} style={{ padding:'9px 12px', background:'#EEF2FF', border:'1.5px solid #C7D2FE', borderRadius:9, fontSize:13, color:'#4F46E5', fontWeight:700, cursor:'pointer' }}>↻ רענן</button>
          <button onClick={exportCSV} style={{ padding:'9px 14px', background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:9, fontSize:13, color:'#166534', fontWeight:700, cursor:'pointer' }}>⬇ Excel / CSV</button>
          <span style={{ fontSize:13, color:'#6B7280', whiteSpace:'nowrap' }}>{filtered.length} מועמדים</span>
        </div>

        {/* Status cards */}
        <div style={{ display:'flex', gap:10 }}>
          {STATUSES.map(s => {
            const cnt = candidates.filter(c=>c.status===s.v).length
            const active = filterStatus===s.v
            return (
              <div key={s.v} onClick={()=>setStatus(active?'':s.v)}
                style={{ flex:1, background:active?s.bg:'white', border:`1.5px solid ${active?s.fg:'#E5E7EB'}`, borderRadius:10, padding:'10px 14px', textAlign:'center', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:20, fontWeight:900, color:active?s.fg:'#374151' }}>{cnt}</div>
                <div style={{ fontSize:11, color:active?s.fg:'#9CA3AF', fontWeight:600 }}>{s.he}</div>
              </div>
            )
          })}
        </div>

        {/* Table */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #E5E7EB', overflow:'hidden', flex:1 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F9FF', borderBottom:'1.5px solid #E5E7EB' }}>
                <TH c='שם'/><TH c='טלפון'/><TH c='מדינה'/><TH c='ענף'/><TH c='מקצוע'/><TH c='ויזה'/><TH c='כניסה לישראל'/><TH c='תוקף'/><TH c='סטטוס'/><TH c='נרשם'/>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:50, color:'#D1D5DB' }}>אין מועמדים תואמים</td></tr>}
              {filtered.map(c => {
                const sel = c.id===selected
                const expired = isExpired(c.permit_expiry)
                const soon    = isSoon(c.permit_expiry)
                return (
                  <tr key={c.id} onClick={()=>setSelected(sel?null:c.id)}
                    style={{ borderBottom:'1px solid #F3F4F6', cursor:'pointer', background:sel?'#EEF2FF':'white', transition:'background .1s' }}
                    onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='#F8F9FF'}}
                    onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='white'}}>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:'#1E1B4B', direction:'rtl', whiteSpace:'nowrap' }}>{c.full_name_he||c.full_name_en||'—'}</td>
                    <td style={{ padding:'10px 14px', color:'#374151', direction:'ltr' }}>{c.phone||'—'}</td>
                    <td style={{ padding:'10px 14px', color:'#6B7280', fontSize:12 }}>{(c.country||'—').split('/')[0].trim()}</td>
                    <td style={{ padding:'10px 14px', color:'#374151' }}>{SECTORS.find(s=>s.v===c.sector)?.he||'—'}</td>
                    <td style={{ padding:'10px 14px', color:'#374151', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(c.profession||'—').split('/')[0].trim()}</td>
                    <td style={{ padding:'10px 14px', color:'#6B7280', fontSize:12 }}>{PERMITS.find(p=>p.v===c.permit_type)?.l||'—'}</td>
                    <td style={{ padding:'10px 14px', color:'#374151', fontSize:12 }}>{c.entry_date ? fmtDate(c.entry_date) : '—'}</td>
                    <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>
                      <span style={{ color:expired?'#DC2626':soon?'#D97706':'#374151', fontWeight:(expired||soon)?700:400 }}>
                        {c.permit_expiry ? fmtDate(c.permit_expiry) : '—'} {expired?'🔴':soon?'🟡':''}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}><Badge status={c.status}/></td>
                    <td style={{ padding:'10px 14px', color:'#9CA3AF', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(c.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {candidate && <DetailPanel candidate={candidate} onUpdate={update} onClose={()=>setSelected(null)} />}
    </div>
  )
}
