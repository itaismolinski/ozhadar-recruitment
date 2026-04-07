import { useState, useEffect, useRef } from 'react'
import { insertCandidate, uploadDoc } from '../../lib/supabase.js'
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../../constants.js'
import { T } from '../../translations.js'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const F = "'Heebo', -apple-system, 'Arial Hebrew', Arial, sans-serif"
const BLUE  = '#0071E3'
const DARK  = '#1D1D1F'
const GRAY  = '#6E6E73'
const LGRAY = '#F5F5F7'
const BORDER= '#D2D2D7'
const WHITE = '#FFFFFF'

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById('apple-reg-styles')) return
    const s = document.createElement('style')
    s.id = 'apple-reg-styles'
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes progressFill {
        from { width: 0%; }
      }
      @keyframes checkPop {
        0%   { transform: scale(0); opacity: 0; }
        60%  { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      .ar-fade-up   { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
      .ar-fade-up-1 { animation-delay: 0.05s; }
      .ar-fade-up-2 { animation-delay: 0.12s; }
      .ar-fade-up-3 { animation-delay: 0.20s; }
      .ar-fade-up-4 { animation-delay: 0.28s; }
      .ar-fade-in   { animation: fadeIn 0.4s ease both; }
      .ar-scale-in  { animation: scaleIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }

      .ar-input {
        width: 100%;
        padding: 14px 16px;
        background: ${WHITE};
        border: 1.5px solid ${BORDER};
        border-radius: 12px;
        font-size: 16px;
        font-family: inherit;
        color: ${DARK};
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        appearance: none;
        -webkit-appearance: none;
      }
      .ar-input:focus {
        border-color: ${BLUE};
        box-shadow: 0 0 0 4px rgba(0,113,227,0.12);
        background: ${WHITE};
      }
      .ar-input.error {
        border-color: #FF3B30;
        box-shadow: 0 0 0 4px rgba(255,59,48,0.1);
      }
      .ar-input::placeholder { color: #B0B0B7; }

      .ar-btn-primary {
        width: 100%;
        padding: 16px;
        background: ${BLUE};
        color: white;
        border: none;
        border-radius: 980px;
        font-size: 17px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        box-shadow: 0 2px 12px rgba(0,113,227,0.28);
        letter-spacing: -0.2px;
      }
      .ar-btn-primary:hover {
        background: #0077ED;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0,113,227,0.35);
      }
      .ar-btn-primary:active { transform: scale(0.98); }
      .ar-btn-primary:disabled {
        background: #A8A8AD;
        box-shadow: none;
        transform: none;
        cursor: not-allowed;
      }

      .ar-btn-secondary {
        width: 100%;
        padding: 16px;
        background: ${LGRAY};
        color: ${DARK};
        border: none;
        border-radius: 980px;
        font-size: 17px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s;
      }
      .ar-btn-secondary:hover { background: #EBEBF0; transform: translateY(-1px); }
      .ar-btn-secondary:active { transform: scale(0.98); }

      .ar-step-dot {
        width: 32px; height: 32px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700;
        transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
        flex-shrink: 0;
      }

      .ar-upload-zone {
        border: 2px dashed ${BORDER};
        border-radius: 16px;
        padding: 28px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s;
        background: ${LGRAY};
      }
      .ar-upload-zone:hover {
        border-color: ${BLUE};
        background: rgba(0,113,227,0.04);
      }
      .ar-upload-zone.has-file {
        border-color: #34C759;
        background: rgba(52,199,89,0.06);
        border-style: solid;
      }

      .ar-card {
        background: ${WHITE};
        border-radius: 20px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.06);
        overflow: hidden;
      }

      .ar-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: ${GRAY};
        margin-bottom: 7px;
        letter-spacing: 0.1px;
      }
      .ar-error-msg {
        font-size: 12px;
        color: #FF3B30;
        margin-top: 5px;
        animation: fadeIn 0.2s ease;
      }

      .ar-select-wrap {
        position: relative;
      }
      .ar-select-wrap::after {
        content: '';
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${GRAY};
        pointer-events: none;
      }
    `
    document.head.appendChild(s)
  }, [])
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total, labels, dir }) {
  return (
    <div style={{ marginBottom: 40 }}>
      {/* Step dots */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        {labels.map((_, i) => {
          const n = i + 1
          const done   = step > n
          const active = step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : 0 }}>
              <div className="ar-step-dot" style={{
                background: done ? '#34C759' : active ? BLUE : LGRAY,
                color: (done || active) ? WHITE : GRAY,
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : n}
              </div>
              {i < labels.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 6px', background: step > n ? '#34C759' : '#E5E5EA', borderRadius: 2, transition: 'background 0.4s' }} />
              )}
            </div>
          )
        })}
      </div>
      {/* Labels */}
      <div style={{ display: 'flex' }}>
        {labels.map((l, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 11, fontWeight: step === i + 1 ? 600 : 400,
            color: step === i + 1 ? BLUE : GRAY,
            transition: 'all 0.2s',
          }}>{l}</div>
        ))}
      </div>
    </div>
  )
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label className="ar-label">{label}</label>
      {children}
      {error && <div className="ar-error-msg">{error}</div>}
    </div>
  )
}

function Input({ label, k, type = 'text', form, onChange, errors, placeholder }) {
  return (
    <Field label={label} error={errors?.[k]}>
      <input
        type={type}
        value={form[k] || ''}
        onChange={e => onChange(k, e.target.value)}
        placeholder={placeholder || ''}
        className={`ar-input${errors?.[k] ? ' error' : ''}`}
      />
    </Field>
  )
}

function Select({ label, k, opts, disabled, form, onChange, errors, placeholder }) {
  return (
    <Field label={label} error={errors?.[k]}>
      <div className="ar-select-wrap">
        <select
          value={form[k] || ''}
          onChange={e => onChange(k, e.target.value)}
          disabled={disabled}
          className={`ar-input${errors?.[k] ? ' error' : ''}`}
          style={{ paddingRight: 16, paddingLeft: 40, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
        >
          <option value=''>{placeholder || '—'}</option>
          {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
        </select>
      </div>
    </Field>
  )
}

function UploadZone({ label, name, file, onChange, t }) {
  const ref = useRef()
  const has = !!file
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="ar-label">{label}</label>
      <div
        className={`ar-upload-zone${has ? ' has-file' : ''}`}
        onClick={() => ref.current.click()}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{has ? '✅' : '📎'}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: has ? '#34C759' : DARK, marginBottom: 4 }}>
          {has ? file.name : t.doc_upload}
        </div>
        <div style={{ fontSize: 12, color: GRAY }}>{t.doc_limit}</div>
        {has && (
          <button
            onClick={e => { e.stopPropagation(); onChange(name, null) }}
            style={{ marginTop: 8, background: 'none', border: 'none', color: '#FF3B30', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            הסר קובץ
          </button>
        )}
      </div>
      <input
        ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files[0]; e.target.value = ''
          if (!f) return
          if (f.size > 25 * 1024 * 1024) { alert('Max 25MB'); return }
          onChange(name, f)
        }}
      />
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RegistrationForm({ lang = 'he', onDone }) {
  useGlobalStyles()

  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(EMPTY_FORM)
  const [files, setFiles] = useState({ passport: null, permit: null, license: null, other: null })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [saveError, setSaveError] = useState('')
  const [animKey, setAnimKey] = useState(0)

  const t   = T[lang] || T.he
  const dir = t.dir || 'rtl'

  const set  = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }
  const setF = (k, v) => setFiles(f => ({ ...f, [k]: v }))
  const fp   = { form, onChange: set, errors }

  const validate = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.fullNameHe && !form.fullNameEn) e.fullNameHe = t.f_required
      if (!form.phone) e.phone = t.f_required
    }
    if (s === 3 && !form.permitType) e.permitType = t.f_required
    return e
  }

  const next = () => {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setStep(s => s + 1); setAnimKey(k => k + 1); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => { setStep(s => s - 1); setAnimKey(k => k + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const submit = async () => {
    setSaving(true); setSaveError('')
    try {
      const record = {
        full_name_he: form.fullNameHe, full_name_en: form.fullNameEn,
        phone: form.phone, email: form.email, dob: form.dob || null,
        country: form.country, city: form.city, sector: form.sector,
        profession: form.profession, experience: form.experience,
        permit_type: form.permitType, permit_number: form.permitNumber,
        permit_expiry: form.permitExpiry || null, entry_date: form.entryDate || null,
        current_employer: form.currentEmployer, last_employer: form.lastEmployer,
        doc_passport: !!files.passport, doc_permit: !!files.permit,
        doc_license: !!files.license, doc_other: !!files.other,
        form_lang: lang,
      }
      const candidate = await insertCandidate(record)
      for (const [field, file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file)
      }
      setDone(true)
    } catch (err) {
      setSaveError('שגיאה בשמירה. נסה שוב.')
      console.error(err)
    } finally { setSaving(false) }
  }

  const STEP_LABELS = [t.step_personal, t.step_work, t.step_visa, t.step_docs]

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }} dir={dir}>
      <div className="ar-scale-in ar-card" style={{ maxWidth: 420, width: '100%', padding: 52, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', animation: 'checkPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M7 18L14 25L29 11" stroke="#34C759" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: DARK, letterSpacing: '-0.5px', marginBottom: 12, fontFamily: F }}>{t.success_title}</h2>
        <p style={{ fontSize: 17, color: GRAY, lineHeight: 1.6, marginBottom: 36, fontFamily: F }}>{t.success_sub}</p>
        <button className="ar-btn-primary" onClick={() => {
          setForm(EMPTY_FORM); setFiles({ passport: null, permit: null, license: null, other: null })
          setErrors({}); setDone(false); setStep(1)
          if (onDone) onDone()
        }}>{t.btn_new_reg}</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 60%)', fontFamily: F, direction: dir }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Header */}
        <div className="ar-fade-up ar-fade-up-1" style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'inline-block', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 980, padding: '6px 16px', fontSize: 13, color: GRAY, marginBottom: 20, fontWeight: 500 }}>
            🌐 Oz Hadar Group
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 700, color: DARK, letterSpacing: '-1px', lineHeight: 1.05, marginBottom: 14 }}>
            {lang === 'he' ? <>מצאנו לך<br/><span style={{ color: BLUE }}>עבודה.</span></> :
             lang === 'ar' ? <>وجدنا لك<br/><span style={{ color: BLUE }}>عمل.</span></> :
             <>We found<br/><span style={{ color: BLUE }}>you work.</span></>}
          </h1>
          <p style={{ fontSize: 17, color: GRAY, lineHeight: 1.6, fontWeight: 400 }}>
            {lang === 'he' ? 'מלא את הפרטים ונחזור אליך תוך 24 שעות.' :
             lang === 'ar' ? 'أكمل البيانات وسنتواصل معك خلال 24 ساعة.' :
             'Fill in your details and we\'ll get back to you within 24 hours.'}
          </p>
        </div>

        {/* Progress */}
        <div className="ar-fade-up ar-fade-up-2">
          <ProgressBar step={step} total={4} labels={STEP_LABELS} dir={dir} />
        </div>

        {/* Card */}
        <div key={animKey} className="ar-card ar-scale-in" style={{ padding: '32px 28px' }}>

          {/* Step header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: BLUE, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
              {t.step_of(step, 4)}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: DARK, letterSpacing: '-0.4px', margin: 0 }}>
              {STEP_LABELS[step - 1]}
            </h2>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="ar-fade-in">
              <Input label={t.f_name_he} k="fullNameHe" {...fp} />
              <Input label={t.f_name_en} k="fullNameEn" {...fp} />
              <Input label={t.f_phone} k="phone" type="tel" {...fp} placeholder="050-1234567" />
              <Input label={t.f_email} k="email" type="email" {...fp} />
              <Input label={t.f_dob} k="dob" type="date" {...fp} />
              <Select label={t.f_country} k="country" placeholder={t.f_select}
                opts={COUNTRIES.map(c => ({ v: c, l: c }))} {...fp} />
              <Select label={t.f_city} k="city" placeholder={t.f_select}
                opts={CITIES.map(c => ({ v: c, l: c }))} {...fp} />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="ar-fade-in">
              <div style={{ background: 'rgba(0,113,227,0.06)', border: '1px solid rgba(0,113,227,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#004A9F', lineHeight: 1.6 }}>
                {t.work_note}
              </div>
              <Select label={t.f_sector} k="sector" placeholder={t.f_select}
                opts={SECTORS.map(s => ({ v: s.v, l: `${s.he} / ${s.en}` }))} {...fp} />
              <Select label={t.f_profession} k="profession" placeholder={form.sector ? t.f_select : t.f_profession_first}
                disabled={!form.sector}
                opts={(PROFESSIONS[form.sector] || []).map(p => ({ v: p, l: p }))} {...fp} />
              <Input label={t.f_experience} k="experience" type="number" {...fp} />
              <Input label={t.f_employer_current} k="currentEmployer" {...fp} />
              <Input label={t.f_employer_last} k="lastEmployer" {...fp} />
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="ar-fade-in">
              <Select label={t.f_permit_type} k="permitType" placeholder={t.f_select}
                opts={PERMITS.map(p => ({ v: p.v, l: p.l }))} {...fp} />
              <Input label={t.f_permit_number} k="permitNumber" {...fp} />
              <Input label={t.f_permit_expiry} k="permitExpiry" type="date" {...fp} />
              <Input label={t.f_entry_date} k="entryDate" type="date" {...fp} />
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="ar-fade-in">
              <p style={{ fontSize: 14, color: GRAY, marginBottom: 20, lineHeight: 1.6 }}>{t.docs_note}</p>
              {DOC_FIELDS.map(d => (
                <UploadZone key={d.k} label={t[`f_doc_${d.k}`] || d.he} name={d.k} file={files[d.k]} onChange={setF} t={t} />
              ))}
            </div>
          )}

          {saveError && (
            <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#FF3B30', marginBottom: 16, textAlign: 'center' }}>
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step > 1 && (
              <button className="ar-btn-secondary" onClick={back} style={{ flex: 1 }}>
                {t.btn_back}
              </button>
            )}
            {step < 4 ? (
              <button className="ar-btn-primary" onClick={next} style={{ flex: 2 }}>
                {t.btn_next}
              </button>
            ) : (
              <button className="ar-btn-primary" onClick={submit} disabled={saving} style={{ flex: 2 }}>
                {saving ? t.btn_submitting : t.btn_submit}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#B0B0B7', fontFamily: F }}>
          {t.footer}
        </p>
      </div>
    </div>
  )
}
