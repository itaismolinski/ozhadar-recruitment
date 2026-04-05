import { useState } from 'react'
import { insertCandidate, uploadDoc } from '../lib/supabase.js'
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../constants.js'

const SANS = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"

const BG = {
  minHeight: 'calc(100vh - 62px)',
  background: 'linear-gradient(160deg, #ecfdf9 0%, #fffcf5 50%, #eff6ff 100%)',
  fontFamily: SANS,
}

const STEPS = [
  { he: 'פרטים אישיים',    en: 'Personal'  },
  { he: 'מקצועי',          en: 'Work'      },
  { he: 'ויזה',            en: 'Visa'      },
  { he: 'מסמכים',          en: 'Docs'      },
]

const INP_ST = (err) => ({
  width: '100%', padding: '12px 14px',
  background: err ? '#FFF5F5' : '#F9FAFB',
  border: `1.5px solid ${err ? '#FCA5A5' : '#E5E7EB'}`,
  borderRadius: 10, color: '#111827',
  fontFamily: SANS, fontSize: 14, outline: 'none', transition: 'border-color .18s',
})

const SEL_ST = (err) => ({
  ...INP_ST(err),
  cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: '12px center', paddingRight: 38,
})

function ProgressBar({ step }) {
  return (
    <div style={{ paddingTop: 4, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STEPS.map((s, i) => {
          const n = i + 1, done = step > n, active = step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0, transition: 'all .3s',
                fontFamily: SANS,
                background: done ? '#0F766E' : active ? 'linear-gradient(135deg,#0F766E,#14B8A6)' : '#F3F4F6',
                color: (done || active) ? '#fff' : '#9CA3AF',
                boxShadow: active ? '0 0 0 4px rgba(15,118,110,.18)' : 'none',
              }}>
                {done ? '✓' : n}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? '#0F766E' : '#E5E7EB', margin: '0 4px', transition: 'background .4s' }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', marginTop: 7 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: step === i + 1 ? '#0F766E' : '#9CA3AF', fontWeight: step === i + 1 ? 700 : 400, transition: 'color .3s', fontFamily: SANS }}>
            {s.he}
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, sub, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 5, letterSpacing: '.2px', fontFamily: SANS }}>
        {label}{sub && <span style={{ color: '#9CA3AF', fontWeight: 400 }}> · {sub}</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3 }}>{error}</div>}
    </div>
  )
}

function Inp({ label, sub, k, type = 'text', form, onChange, errors }) {
  return (
    <Field label={label} sub={sub} error={errors?.[k]}>
      <input type={type} value={form[k] || ''} onChange={e => onChange(k, e.target.value)}
        style={INP_ST(errors?.[k])}
        onFocus={e => e.target.style.borderColor = '#0F766E'}
        onBlur={e => e.target.style.borderColor = errors?.[k] ? '#FCA5A5' : '#E5E7EB'}
      />
    </Field>
  )
}

function Sel({ label, sub, k, opts, disabled, form, onChange, errors }) {
  return (
    <Field label={label} sub={sub} error={errors?.[k]}>
      <select value={form[k] || ''} onChange={e => onChange(k, e.target.value)} disabled={disabled}
        style={{ ...SEL_ST(errors?.[k]), cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 }}>
        <option value=''>{disabled ? '— בחר ענף תחילה —' : '— בחר / Select —'}</option>
        {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    </Field>
  )
}

function FileField({ label, sub, name, file, onChange }) {
  const has = !!file
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 5, fontFamily: SANS }}>
        {label} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>· {sub}</span>
      </div>
      <div onClick={() => document.getElementById('fi_' + name).click()}
        style={{ border: `2px dashed ${has ? '#0F766E' : '#E5E7EB'}`, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', background: has ? '#f0fdf4' : '#F9FAFB', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s' }}>
        <span style={{ fontSize: 20 }}>{has ? '✅' : '📎'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: has ? '#0F766E' : '#9CA3AF', fontWeight: has ? 600 : 400, fontFamily: SANS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {has ? file.name : 'לחץ להעלאה · Click to upload'}
          </div>
          <div style={{ fontSize: 11, color: '#D1D5DB', fontFamily: SANS }}>PDF · JPG · PNG — עד 25MB</div>
        </div>
        {has && <span onClick={e => { e.stopPropagation(); onChange(name, null) }} style={{ color: '#D1D5DB', cursor: 'pointer', fontSize: 16 }}>✕</span>}
      </div>
      <input id={'fi_' + name} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 25 * 1024 * 1024) { alert('מקסימום 25MB'); return; } onChange(name, f) }} />
    </div>
  )
}

function Card({ titleHe, titleEn, children }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #F3F4F6', borderRadius: 16, padding: '20px', marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1.5px solid #F3F4F6' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: DISPLAY }}>{titleHe}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: SANS }}>{titleEn}</div>
      </div>
      {children}
    </div>
  )
}

export default function RegistrationForm({ onDone }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState({ passport: null, permit: null, license: null, other: null })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }
  const setF = (k, v) => setFiles(f => ({ ...f, [k]: v }))

  const fProps = { form, onChange: set, errors }

  const validate = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.fullNameHe && !form.fullNameEn) e.fullNameHe = 'נדרש שם'
      if (!form.phone) e.phone = 'נדרש'
    }
    if (s === 3 && !form.permitType) e.permitType = 'נדרש'
    return e
  }

  const next = () => {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setStep(s => s + 1); window.scrollTo(0, 0)
  }
  const back = () => { setStep(s => s - 1); window.scrollTo(0, 0) }

  const submit = async () => {
    setSaving(true); setSaveError('')
    try {
      const record = {
        full_name_he: form.fullNameHe, full_name_en: form.fullNameEn,
        phone: form.phone, email: form.email,
        dob: form.dob || null, country: form.country, city: form.city,
        sector: form.sector, profession: form.profession, experience: form.experience,
        permit_type: form.permitType, permit_number: form.permitNumber,
        permit_expiry: form.permitExpiry || null, entry_date: form.entryDate || null,
        current_employer: form.currentEmployer, last_employer: form.lastEmployer,
        doc_passport: !!files.passport, doc_permit: !!files.permit,
        doc_license: !!files.license, doc_other: !!files.other,
      }
      const candidate = await insertCandidate(record)
      for (const [field, file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file)
      }
      setDone(true)
    } catch (err) {
      setSaveError('שגיאה בשמירה — נסה שוב / Save error — please retry')
      console.error(err)
    } finally { setSaving(false) }
  }

  if (done) return (
    <div style={{ ...BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 22 }}>✅</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, color: '#0F766E', marginBottom: 10 }}>הפרטים נשמרו!</h2>
        <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 7, fontFamily: SANS }}>Details submitted successfully</p>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 30, fontFamily: SANS }}>ניצור קשר בהקדם · We'll be in touch soon</p>
        <button onClick={() => { setForm(EMPTY_FORM); setFiles({ passport: null, permit: null, license: null, other: null }); setErrors({}); setDone(false); setStep(1); onDone() }}
          style={{ padding: '14px 32px', background: '#0F766E', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, boxShadow: '0 4px 16px rgba(15,118,110,.25)' }}>
          הרשמה נוספת / New Registration
        </button>
      </div>
    </div>
  )

  return (
    <div style={BG}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 52px' }}>
        <ProgressBar step={step} />

        {step === 1 && (
          <Card titleHe="פרטים אישיים" titleEn="Personal Information">
            <Inp label="שם מלא בעברית" sub="Full Name (Hebrew)" k="fullNameHe" {...fProps} />
            <Inp label="שם מלא באנגלית" sub="Full Name (Latin)" k="fullNameEn" {...fProps} />
            <Inp label="טלפון" sub="Phone" k="phone" type="tel" {...fProps} />
            <Inp label="אימייל" sub="Email" k="email" type="email" {...fProps} />
            <Inp label="תאריך לידה" sub="Date of Birth" k="dob" type="date" {...fProps} />
            <Sel label="מדינת מוצא" sub="Country of Origin" k="country" opts={COUNTRIES.map(c => ({ v: c, l: c }))} {...fProps} />
            <Sel label="עיר מגורים" sub="City of Residence" k="city" opts={CITIES.map(c => ({ v: c, l: c }))} {...fProps} />
          </Card>
        )}

        {step === 2 && (
          <Card titleHe="פרטים מקצועיים" titleEn="Professional Details">
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, direction: 'rtl' }}>
              <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.7, fontFamily: SANS }}>
                💡 אין חובה למלא — לחץ המשך אם אינך מוצא את התחום שלך.
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7, marginTop: 5, direction: 'ltr', fontFamily: SANS }}>
                Not required — click Continue if you don't find your field.
              </p>
            </div>
            <Sel label="ענף" sub="Sector" k="sector" opts={SECTORS.map(s => ({ v: s.v, l: `${s.he} / ${s.en}` }))} {...fProps} />
            <Field label="מקצוע" sub="Profession">
              <select value={form.profession || ''} onChange={e => set('profession', e.target.value)} disabled={!form.sector}
                style={{ ...SEL_ST(false), cursor: form.sector ? 'pointer' : 'not-allowed', opacity: form.sector ? 1 : .5 }}>
                <option value=''>{form.sector ? '— בחר מקצוע —' : '— בחר ענף תחילה —'}</option>
                {(PROFESSIONS[form.sector] || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Inp label="שנות ניסיון" sub="Years of Experience" k="experience" type="number" {...fProps} />
            <Inp label="מקום עבודה נוכחי" sub="Current Employer" k="currentEmployer" {...fProps} />
            <Inp label="מקום עבודה אחרון" sub="Last Employer" k="lastEmployer" {...fProps} />
          </Card>
        )}

        {step === 3 && (
          <Card titleHe="מעמד ורישיונות" titleEn="Legal Status & Permits">
            <Sel label="סוג ויזה / היתר" sub="Permit Type" k="permitType" opts={PERMITS.map(p => ({ v: p.v, l: p.l }))} {...fProps} />
            <Inp label="מספר היתר / דרכון" sub="Permit / Passport No." k="permitNumber" {...fProps} />
            <Inp label="תוקף ויזה" sub="Permit Expiry" k="permitExpiry" type="date" {...fProps} />
            <Inp label="תאריך כניסה לישראל" sub="Date of Entry to Israel" k="entryDate" type="date" {...fProps} />
          </Card>
        )}

        {step === 4 && (
          <Card titleHe="מסמכים" titleEn="Document Uploads">
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, direction: 'rtl', lineHeight: 1.7, fontFamily: SANS }}>
              ניתן לדלג על שדות שאינם רלוונטיים.
            </p>
            {DOC_FIELDS.map(d => (
              <FileField key={d.k} label={d.he} sub={d.en} name={d.k} file={files[d.k]} onChange={setF} />
            ))}
          </Card>
        )}

        {saveError && <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 12, fontFamily: SANS }}>{saveError}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          {step > 1 && (
            <button onClick={back}
              style={{ flex: 1, padding: 14, background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}>
              ← חזרה / Back
            </button>
          )}
          {step < 4 && (
            <button onClick={next}
              style={{ flex: 2, padding: 14, background: '#0F766E', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: SANS, boxShadow: '0 4px 14px rgba(15,118,110,.22)' }}>
              המשך / Continue →
            </button>
          )}
          {step === 4 && (
            <button onClick={submit} disabled={saving}
              style={{ flex: 2, padding: 14, background: saving ? '#6EE7B7' : '#0F766E', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: SANS }}>
              {saving ? 'שולח...' : 'שלח פרטים · Submit ✓'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#D1D5DB', fontFamily: SANS }}>
          שלב {step} מתוך {STEPS.length} · Step {step} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}
