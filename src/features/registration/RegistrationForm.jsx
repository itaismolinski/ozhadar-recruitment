import { useState } from 'react'
import { insertCandidate, uploadDoc } from '../../lib/supabase.js'
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../../constants.js'
import { T } from '../../translations.js'

const SANS    = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"
const TEAL    = '#0F766E'

const BG = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #ecfdf9 0%, #fffcf5 50%, #eff6ff 100%)',
  fontFamily: SANS,
}

// ─── INPUT STYLE ─────────────────────────────────────────────────────────────
const INP_ST = (err) => ({
  width: '100%', padding: '11px 13px',
  background: err ? '#FFF5F5' : '#F9FAFB',
  border: `1.5px solid ${err ? '#FCA5A5' : '#E5E7EB'}`,
  borderRadius: 10, color: '#111827',
  fontFamily: SANS, fontSize: 14, outline: 'none', transition: 'border-color .18s',
})
const SEL_ST = (err) => ({
  ...INP_ST(err), cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: '12px center', paddingRight: 38,
})

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, t }) {
  const STEPS = [t.step_personal, t.step_work, t.step_visa, t.step_docs]
  return (
    <div style={{paddingTop:4,marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center'}}>
        {STEPS.map((_, i) => {
          const n=i+1, done=step>n, active=step===n
          return (
            <div key={n} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0,transition:'all .3s',fontFamily:SANS,background:done?TEAL:active?`linear-gradient(135deg,${TEAL},#14B8A6)`:'#F3F4F6',color:(done||active)?'#fff':'#9CA3AF',boxShadow:active?`0 0 0 4px rgba(15,118,110,.18)`:'none'}}>
                {done?'✓':n}
              </div>
              {i<STEPS.length-1 && <div style={{flex:1,height:2,background:done?TEAL:'#E5E7EB',margin:'0 4px',transition:'background .4s'}}/>}
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',marginTop:6}}>
        {STEPS.map((s,i) => (
          <div key={i} style={{flex:1,textAlign:'center',fontSize:10,color:step===i+1?TEAL:'#9CA3AF',fontWeight:step===i+1?700:400,fontFamily:SANS}}>{s}</div>
        ))}
      </div>
    </div>
  )
}

// ─── FIELD COMPONENTS ─────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{marginBottom:13}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4B5563',marginBottom:4,letterSpacing:'.2px',fontFamily:SANS}}>{label}</label>
      {children}
      {error && <div style={{fontSize:11,color:'#EF4444',marginTop:3}}>{error}</div>}
    </div>
  )
}

function Inp({ label, k, type='text', form, onChange, errors }) {
  return (
    <Field label={label} error={errors?.[k]}>
      <input type={type} value={form[k]||''} onChange={e=>onChange(k,e.target.value)}
        style={INP_ST(errors?.[k])}
        onFocus={e=>e.target.style.borderColor=TEAL}
        onBlur={e=>e.target.style.borderColor=errors?.[k]?'#FCA5A5':'#E5E7EB'}/>
    </Field>
  )
}

function Sel({ label, k, opts, disabled, form, onChange, errors, placeholder }) {
  return (
    <Field label={label} error={errors?.[k]}>
      <select value={form[k]||''} onChange={e=>onChange(k,e.target.value)} disabled={disabled}
        style={{...SEL_ST(errors?.[k]),cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1}}>
        <option value=''>{placeholder||'—'}</option>
        {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </Field>
  )
}

function FileField({ label, name, file, onChange, t }) {
  const has = !!file
  return (
    <div style={{marginBottom:9}}>
      <div style={{fontSize:12,fontWeight:600,color:'#4B5563',marginBottom:4,fontFamily:SANS}}>{label}</div>
      <div onClick={()=>document.getElementById('fi_'+name).click()}
        style={{border:`2px dashed ${has?TEAL:'#E5E7EB'}`,borderRadius:10,padding:'10px 14px',cursor:'pointer',background:has?'#F0FDF9':'#F9FAFB',display:'flex',alignItems:'center',gap:10,transition:'all .2s'}}>
        <span style={{fontSize:18}}>{has?'✅':'📎'}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:has?TEAL:'#9CA3AF',fontWeight:has?600:400,fontFamily:SANS,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {has ? file.name : t.doc_upload}
          </div>
          <div style={{fontSize:11,color:'#D1D5DB',fontFamily:SANS}}>{t.doc_limit}</div>
        </div>
        {has && <span onClick={e=>{e.stopPropagation();onChange(name,null)}} style={{color:'#D1D5DB',cursor:'pointer',fontSize:14}}>✕</span>}
      </div>
      <input id={'fi_'+name} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}
        onChange={e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>25*1024*1024){alert('Max 25MB');return;}onChange(name,f)}}/>
    </div>
  )
}

function Card({ titleHe, titleEn, children, dir }) {
  return (
    <div style={{background:'#fff',border:'1.5px solid #F3F4F6',borderRadius:14,padding:'18px 18px',marginBottom:12,boxShadow:'0 1px 8px rgba(0,0,0,.04)'}}>
      <div style={{marginBottom:14,paddingBottom:11,borderBottom:'1.5px solid #F3F4F6',direction:dir}}>
        <div style={{fontSize:15,fontWeight:700,color:'#111827',fontFamily:DISPLAY}}>{titleHe}</div>
        {titleEn && <div style={{fontSize:11,color:'#9CA3AF',marginTop:2,fontFamily:SANS,direction:'ltr',textAlign:dir==='rtl'?'right':'left'}}>{titleEn}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export default function RegistrationForm({ lang='he', onDone }) {
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(EMPTY_FORM)
  const [files, setFiles] = useState({passport:null,permit:null,license:null,other:null})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [saveError, setSaveError] = useState('')

  const t   = T[lang] || T.he
  const dir = t.dir

  const set  = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})) }
  const setF = (k,v) => setFiles(f=>({...f,[k]:v}))
  const fp   = { form, onChange:set, errors }

  const validate = (s) => {
    const e = {}
    if (s===1) {
      if (!form.fullNameHe && !form.fullNameEn) e.fullNameHe = t.f_required
      if (!form.phone) e.phone = t.f_required
    }
    if (s===3 && !form.permitType) e.permitType = t.f_required
    return e
  }

  const next = () => {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setStep(s=>s+1); window.scrollTo(0,0)
  }
  const back = () => { setStep(s=>s-1); window.scrollTo(0,0) }

  const submit = async () => {
    setSaving(true); setSaveError('')
    try {
      const record = {
        full_name_he:form.fullNameHe, full_name_en:form.fullNameEn,
        phone:form.phone, email:form.email, dob:form.dob||null,
        country:form.country, city:form.city, sector:form.sector,
        profession:form.profession, experience:form.experience,
        permit_type:form.permitType, permit_number:form.permitNumber,
        permit_expiry:form.permitExpiry||null, entry_date:form.entryDate||null,
        current_employer:form.currentEmployer, last_employer:form.lastEmployer,
        doc_passport:!!files.passport, doc_permit:!!files.permit,
        doc_license:!!files.license, doc_other:!!files.other,
        form_lang: lang,
      }
      const candidate = await insertCandidate(record)
      for (const [field,file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file)
      }
      setDone(true)
    } catch(err) {
      setSaveError('שגיאה / Error — ' + err.message)
      console.error(err)
    } finally { setSaving(false) }
  }

  // ── SUCCESS ──
  if (done) return (
    <div style={{...BG,display:'flex',alignItems:'center',justifyContent:'center',direction:dir}}>
      <div style={{textAlign:'center',padding:40}}>
        <div style={{fontSize:76,marginBottom:20}}>✅</div>
        <h2 style={{fontFamily:DISPLAY,fontSize:32,fontWeight:800,color:TEAL,marginBottom:10}}>{t.success_title}</h2>
        <p style={{fontSize:15,color:'#6B7280',marginBottom:28,fontFamily:SANS}}>{t.success_sub}</p>
        <button onClick={()=>{setForm(EMPTY_FORM);setFiles({passport:null,permit:null,license:null,other:null});setErrors({});setDone(false);setStep(1);if(onDone)onDone()}}
          style={{padding:'13px 30px',background:TEAL,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:SANS,boxShadow:'0 4px 14px rgba(15,118,110,.25)'}}>
          {t.btn_new_reg}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{...BG, direction:dir}}>
      <div style={{maxWidth:540,margin:'0 auto',padding:'18px 16px 52px'}}>
        <ProgressBar step={step} t={t} />

        {/* ── STEP 1: PERSONAL ── */}
        {step===1 && (
          <Card titleHe={t.step_personal} titleEn="Personal Information" dir={dir}>
            <Inp label={t.f_name_he} k="fullNameHe" {...fp}/>
            <Inp label={t.f_name_en} k="fullNameEn" {...fp}/>
            <Inp label={t.f_phone}   k="phone" type="tel" {...fp}/>
            <Inp label={t.f_email}   k="email" type="email" {...fp}/>
            <Inp label={t.f_dob}     k="dob"   type="date" {...fp}/>
            <Sel label={t.f_country} k="country" placeholder={t.f_select} opts={COUNTRIES.map(c=>({v:c,l:c}))} {...fp}/>
            <Sel label={t.f_city}    k="city"    placeholder={t.f_select} opts={CITIES.map(c=>({v:c,l:c}))} {...fp}/>
          </Card>
        )}

        {/* ── STEP 2: WORK ── */}
        {step===2 && (
          <Card titleHe={t.step_work} titleEn="Professional Details" dir={dir}>
            <div style={{background:'#f0fdf4',border:'1.5px solid #bbf7d0',borderRadius:9,padding:'9px 13px',marginBottom:14,fontSize:12,color:'#4B5563',lineHeight:1.7,direction:dir,fontFamily:SANS}}>
              {t.work_note}
            </div>
            <Sel label={t.f_sector} k="sector" placeholder={t.f_select}
              opts={SECTORS.map(s=>({v:s.v,l:`${s.he} / ${s.en}`}))} {...fp}/>
            <Field label={t.f_profession} error={errors.profession}>
              <select value={form.profession||''} onChange={e=>set('profession',e.target.value)}
                disabled={!form.sector}
                style={{...SEL_ST(false),cursor:form.sector?'pointer':'not-allowed',opacity:form.sector?1:.5}}>
                <option value=''>{form.sector?t.f_select:t.f_profession_first}</option>
                {(PROFESSIONS[form.sector]||[]).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Inp label={t.f_experience}       k="experience" type="number" {...fp}/>
            <Inp label={t.f_employer_current} k="currentEmployer" {...fp}/>
            <Inp label={t.f_employer_last}    k="lastEmployer" {...fp}/>
          </Card>
        )}

        {/* ── STEP 3: VISA ── */}
        {step===3 && (
          <Card titleHe={t.step_visa} titleEn="Legal Status & Permits" dir={dir}>
            <Sel label={t.f_permit_type}   k="permitType"  placeholder={t.f_select} opts={PERMITS.map(p=>({v:p.v,l:p.l}))} {...fp}/>
            <Inp label={t.f_permit_number} k="permitNumber" {...fp}/>
            <Inp label={t.f_permit_expiry} k="permitExpiry" type="date" {...fp}/>
            <Inp label={t.f_entry_date}    k="entryDate"    type="date" {...fp}/>
          </Card>
        )}

        {/* ── STEP 4: DOCS ── */}
        {step===4 && (
          <Card titleHe={t.step_docs} titleEn="Document Uploads" dir={dir}>
            <p style={{fontSize:13,color:'#6B7280',marginBottom:14,lineHeight:1.7,fontFamily:SANS,direction:dir}}>{t.docs_note}</p>
            {DOC_FIELDS.map(d=>(
              <FileField key={d.k} label={t[`f_doc_${d.k}`]||d.he} name={d.k} file={files[d.k]} onChange={setF} t={t}/>
            ))}
          </Card>
        )}

        {saveError && <p style={{fontSize:13,color:'#EF4444',textAlign:'center',marginBottom:12,fontFamily:SANS}}>{saveError}</p>}

        <div style={{display:'flex',gap:12}}>
          {step>1 && (
            <button onClick={back}
              style={{flex:1,padding:13,background:'#F9FAFB',color:'#6B7280',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:SANS}}>
              {t.btn_back}
            </button>
          )}
          {step<4 && (
            <button onClick={next}
              style={{flex:2,padding:13,background:TEAL,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:SANS,boxShadow:'0 4px 14px rgba(15,118,110,.2)'}}>
              {t.btn_next}
            </button>
          )}
          {step===4 && (
            <button onClick={submit} disabled={saving}
              style={{flex:2,padding:13,background:saving?'#6EE7B7':TEAL,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:SANS}}>
              {saving ? t.btn_submitting : t.btn_submit}
            </button>
          )}
        </div>

        <p style={{textAlign:'center',marginTop:12,fontSize:11,color:'#D1D5DB',fontFamily:SANS}}>
          {t.step_of(step, 4)}
        </p>
      </div>
    </div>
  )
}
