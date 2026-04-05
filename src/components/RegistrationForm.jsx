import { useState } from 'react'
import { insertCandidate, uploadDoc } from '../lib/supabase.js'
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../constants.js'

function FileField({ label, sub, name, file, onChange }) {
  const ref = { current: null }
  const has = !!file
  const inputRef = (el) => { ref.current = el }
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
        {label} <span style={{ fontWeight:400, color:'#9CA3AF' }}>· {sub}</span>
      </div>
      <div onClick={() => document.getElementById('fi_'+name).click()}
        style={{ border:`2px dashed ${has ? '#86EFAC' : '#D1D5DB'}`, borderRadius:10, padding:'10px 14px', cursor:'pointer', background: has ? '#F0FDF4' : '#FAFAFA', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:22 }}>{has ? '✅' : '📎'}</span>
        <div style={{ flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:13, color: has ? '#15803D' : '#6B7280', fontWeight: has ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {has ? file.name : 'לחץ להעלאה · Click to upload'}
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF' }}>PDF · JPG · PNG — עד 25MB</div>
        </div>
        {has && <span onClick={e=>{e.stopPropagation();onChange(name,null)}} style={{ color:'#D1D5DB', cursor:'pointer', fontSize:18 }}>✕</span>}
      </div>
      <input id={'fi_'+name} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
        onChange={e=>{
          const f=e.target.files[0]; e.target.value=''
          if(!f) return
          if(f.size>25*1024*1024){alert('קובץ גדול מדי — מקסימום 25MB');return}
          onChange(name,f)
        }} />
    </div>
  )
}

export default function RegistrationForm({ onDone }) {
  const [form, setForm]   = useState(EMPTY_FORM)
  const [files, setFiles] = useState({ passport:null, permit:null, license:null, other:null })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)
  const [saveError, setSaveError] = useState('')

  const set  = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})) }
  const setF = (k,v) => setFiles(f=>({...f,[k]:v}))

  const validate = () => {
    const e = {}
    if (!form.fullNameHe && !form.fullNameEn) e.fullNameHe = 'נדרש שם'
    if (!form.phone)      e.phone      = 'נדרש'
    if (!form.permitType) e.permitType = 'נדרש'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setSaveError('')
    try {
      const record = {
        full_name_he:    form.fullNameHe,
        full_name_en:    form.fullNameEn,
        phone:           form.phone,
        email:           form.email,
        dob:             form.dob       || null,
        country:         form.country,
        city:            form.city,
        sector:          form.sector,
        profession:      form.profession,
        experience:      form.experience,
        permit_type:     form.permitType,
        permit_number:   form.permitNumber,
        permit_expiry:   form.permitExpiry || null,
        entry_date:      form.entryDate   || null,
        current_employer: form.currentEmployer,
        last_employer:   form.lastEmployer,
        doc_passport:    !!files.passport,
        doc_permit:      !!files.permit,
        doc_license:     !!files.license,
        doc_other:       !!files.other,
      }
      const candidate = await insertCandidate(record)
      // Upload files
      for (const [field, file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file)
      }
      setDone(true)
    } catch (err) {
      setSaveError('שגיאה בשמירה — נסה שוב / Save error — please retry')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:20 }}>
      <div style={{ fontSize:72 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:800, color:'#065F46' }}>הפרטים נשמרו בהצלחה!</div>
      <div style={{ color:'#6B7280', fontSize:14 }}>Details submitted successfully</div>
      <button onClick={() => { setForm(EMPTY_FORM); setFiles({passport:null,permit:null,license:null,other:null}); setErrors({}); setDone(false); onDone() }}
        style={{ marginTop:8, padding:'12px 28px', background:'#1D4ED8', color:'white', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:15, fontFamily:'inherit' }}>
        הרשמה נוספת / New Registration
      </button>
    </div>
  )

  const inp = (label, k, type='text', req=false) => (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
        {label}{req && <span style={{ color:'#EF4444' }}> *</span>}
      </label>
      <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)}
        style={{ width:'100%', padding:'9px 13px', border:`1.5px solid ${errors[k]?'#F87171':'#E5E7EB'}`, borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box', background:'white', fontFamily:'inherit' }} />
      {errors[k] && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors[k]}</div>}
    </div>
  )

  const sel = (label, k, opts, req=false, disabled=false) => (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
        {label}{req && <span style={{ color:'#EF4444' }}> *</span>}
      </label>
      <select value={form[k]} onChange={e=>set(k,e.target.value)} disabled={disabled}
        style={{ width:'100%', padding:'9px 13px', border:`1.5px solid ${errors[k]?'#F87171':'#E5E7EB'}`, borderRadius:9, fontSize:14, background:disabled?'#F9FAFB':'white', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}>
        <option value=''>— בחר / Select —</option>
        {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
      {errors[k] && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors[k]}</div>}
    </div>
  )

  const sec = (he, en) => (
    <div style={{ borderBottom:'2.5px solid #EEF2FF', paddingBottom:10, marginBottom:18 }}>
      <span style={{ fontWeight:800, fontSize:15, color:'#1E1B4B' }}>{he}</span>
      <span style={{ fontSize:12, color:'#A5B4FC', margin:'0 10px' }}>·</span>
      <span style={{ fontWeight:500, fontSize:12, color:'#9CA3AF' }}>{en}</span>
    </div>
  )

  const grid = children => <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{children}</div>

  return (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'32px 20px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#1E1B4B', direction:'rtl' }}>טופס הרשמה למועמד לעבודה</div>
        <div style={{ fontSize:14, color:'#9CA3AF', marginTop:5 }}>Worker Registration Form — Oz Hadar Group</div>
      </div>

      <div style={{ background:'white', borderRadius:16, border:'1px solid #E5E7EB', boxShadow:'0 1px 3px rgba(0,0,0,.06)', padding:28, display:'flex', flexDirection:'column', gap:26 }}>

        <section>
          {sec('פרטים אישיים','Personal Information')}
          {grid(<>
            {inp('שם מלא (עברית) / Full Name (Hebrew)','fullNameHe','text',true)}
            {inp('שם מלא (אנגלית) / Full Name (Latin)','fullNameEn')}
            {inp('טלפון / Phone','phone','tel',true)}
            {inp('אימייל / Email','email','email')}
            {inp('תאריך לידה / Date of Birth','dob','date')}
            {sel('מדינת לידה / Country of Origin','country',COUNTRIES.map(c=>({v:c,l:c})))}
            {sel('עיר מגורים / City of Residence','city',CITIES.map(c=>({v:c,l:c})))}
          </>)}
        </section>

        <section>
          {sec('פרטים מקצועיים','Professional Details')}
          {grid(<>
            {sel('ענף / Sector','sector',SECTORS.map(s=>({v:s.v,l:`${s.he} / ${s.en}`})))}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>מקצוע / Profession</label>
              <select value={form.profession} onChange={e=>set('profession',e.target.value)} disabled={!form.sector}
                style={{ width:'100%', padding:'9px 13px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:14, background:form.sector?'white':'#F9FAFB', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}>
                <option value=''>{form.sector ? '— בחר —' : '— בחר ענף תחילה —'}</option>
                {(PROFESSIONS[form.sector]||[]).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {inp('שנות ניסיון / Years of Experience','experience','number')}
            {inp('מקום עבודה נוכחי / Current Employer','currentEmployer')}
            {inp('מקום עבודה אחרון / Last Employer','lastEmployer')}
          </>)}
        </section>

        <section>
          {sec('מעמד ורישיונות','Legal Status & Permits')}
          {grid(<>
            {sel('סוג ויזה / היתר · Permit Type','permitType',PERMITS.map(p=>({v:p.v,l:p.l})),true)}
            {inp('מספר היתר / דרכון · Permit / Passport No.','permitNumber')}
            {inp('תוקף ויזה / Permit Expiry','permitExpiry','date')}
            {inp('תאריך כניסה לישראל / Date of Entry to Israel','entryDate','date')}
          </>)}
        </section>

        <section>
          {sec('מסמכים','Document Uploads')}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {DOC_FIELDS.map(d=>(
              <FileField key={d.k} label={d.he} sub={d.en} name={d.k} file={files[d.k]} onChange={setF} />
            ))}
          </div>
        </section>

        {saveError && <div style={{ fontSize:13, color:'#DC2626', textAlign:'center', padding:'10px 0' }}>{saveError}</div>}

        <button onClick={submit} disabled={saving}
          style={{ width:'100%', padding:15, background:saving?'#818CF8':'#1D4ED8', color:'white', border:'none', borderRadius:11, fontSize:15, fontWeight:800, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', transition:'background .2s' }}>
          {saving ? 'שולח... / Submitting...' : 'שלח פרטים · Submit Registration'}
        </button>
      </div>
    </div>
  )
}
