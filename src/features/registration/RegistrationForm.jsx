import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { insertCandidate, uploadDoc } from '../../lib/supabase.js'
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../../constants.js'
import { T } from '../../translations.js'

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const TEAL = '#0F766E'
const BLUE = '#1E40AF'
const CREAM = '#F8F9FA'
const DARK_GRAY = '#374151'
const BLACK = '#111827'

// ─── ANIMATIONS ────────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, x: 50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -50 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, t }) {
  const STEPS = [t.step_personal, t.step_work, t.step_visa, t.step_docs]
  return (
    <div className="mb-12">
      <div className="flex items-center mb-4">
        {STEPS.map((_, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={n} className="flex items-center flex-1">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  done ? 'bg-blue-600 text-white shadow-lg' : active ? 'bg-blue-600 text-white shadow-xl ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {done ? '✓' : n}
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div
                  className={`flex-1 h-1 mx-2 rounded-full ${done ? 'bg-blue-600' : 'bg-gray-200'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 text-center text-sm font-medium ${step === i + 1 ? 'text-blue-600' : 'text-gray-500'}`}>
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FIELD COMPONENTS ─────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}

function Inp({ label, k, type = 'text', form, onChange, errors }) {
  const [focused, setFocused] = useState(false)
  const hasValue = form[k] && form[k].toString().length > 0
  return (
    <Field label={label} error={errors?.[k]}>
      <div className="relative">
        <input
          type={type}
          value={form[k] || ''}
          onChange={e => onChange(k, e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 bg-white border-2 rounded-2xl text-gray-900 placeholder-transparent transition-all duration-300 ${
            errors?.[k] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } focus:outline-none focus:ring-4 focus:ring-blue-100`}
          placeholder={label}
        />
        <motion.label
          className={`absolute left-4 transition-all duration-300 pointer-events-none ${
            focused || hasValue ? 'top-1 text-xs text-blue-600' : 'top-3 text-base text-gray-500'
          }`}
          animate={{ y: focused || hasValue ? -8 : 0 }}
        >
          {label}
        </motion.label>
      </div>
    </Field>
  )
}

function Sel({ label, k, opts, disabled, form, onChange, errors, placeholder }) {
  return (
    <Field label={label} error={errors?.[k]}>
      <select
        value={form[k] || ''}
        onChange={e => onChange(k, e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white border-2 rounded-2xl text-gray-900 transition-all duration-300 ${
          errors?.[k] ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'
        } focus:outline-none focus:ring-4 focus:ring-blue-100 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <option value=''>{placeholder || '—'}</option>
        {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    </Field>
  )
}

function FileField({ label, name, file, onChange, t }) {
  const has = !!file
  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-gray-700 mb-2">{label}</div>
      <div
        onClick={() => document.getElementById('fi_' + name).click()}
        className={`border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
          has ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`text-3xl ${has ? 'text-blue-600' : 'text-gray-400'}`}>{has ? '✅' : '📎'}</div>
          <div className="flex-1">
            <div className={`text-base font-medium ${has ? 'text-blue-600' : 'text-gray-600'}`}>
              {has ? file.name : t.doc_upload}
            </div>
            <div className="text-sm text-gray-500">{t.doc_limit}</div>
          </div>
          {has && (
            <button
              onClick={e => { e.stopPropagation(); onChange(name, null) }}
              className="text-gray-400 hover:text-red-500 text-xl"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <input
        id={'fi_' + name}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => {
          const f = e.target.files[0]
          e.target.value = ''
          if (!f) return
          if (f.size > 25 * 1024 * 1024) {
            alert('Max 25MB')
            return
          }
          onChange(name, f)
        }}
      />
    </div>
  )
}

function Card({ titleHe, titleEn, children, dir }) {
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 pb-4 border-b border-gray-100">
        <div className={`text-2xl font-bold text-gray-900 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{titleHe}</div>
        {titleEn && <div className={`text-sm text-gray-500 mt-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{titleEn}</div>}
      </div>
      {children}
    </motion.div>
  )
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export default function RegistrationForm({ lang = 'he', onDone }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState({ passport: null, permit: null, license: null, other: null })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [saveError, setSaveError] = useState('')

  const t = T[lang] || T.he
  const dir = t.dir

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }
  const setF = (k, v) => setFiles(f => ({ ...f, [k]: v }))

  const fp = { form, onChange: set, errors }

  const validate = s => {
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
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setErrors({})
    setStep(s => s + 1)
  }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const record = {
        full_name_he: form.fullNameHe,
        full_name_en: form.fullNameEn,
        phone: form.phone,
        email: form.email,
        dob: form.dob || null,
        country: form.country,
        city: form.city,
        sector: form.sector,
        profession: form.profession,
        experience: form.experience,
        permit_type: form.permitType,
        permit_number: form.permitNumber,
        permit_expiry: form.permitExpiry || null,
        entry_date: form.entryDate || null,
        current_employer: form.currentEmployer,
        last_employer: form.lastEmployer,
        doc_passport: !!files.passport,
        doc_permit: !!files.permit,
        doc_license: !!files.license,
        doc_other: !!files.other,
        form_lang: lang,
      }
      const candidate = await insertCandidate(record)
      for (const [field, file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file)
      }
      setDone(true)
    } catch (err) {
      setSaveError('שגיאה / Error — ' + err.message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── SUCCESS ──
  if (done) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="text-center max-w-md">
          <motion.div
            className="text-8xl mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            ✅
          </motion.div>
          <motion.h2
            className="text-4xl font-bold text-gray-900 mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {t.success_title}
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {t.success_sub}
          </motion.p>
          <motion.button
            onClick={() => {
              setForm(EMPTY_FORM)
              setFiles({ passport: null, permit: null, license: null, other: null })
              setErrors({})
              setDone(false)
              setStep(1)
              if (onDone) onDone()
            }}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {t.btn_new_reg}
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-4">
            {t.form_title || 'Join Oz Hadar'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.form_subtitle || 'Complete your registration in a few simple steps'}
          </p>
        </motion.div>

        <ProgressBar step={step} t={t} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`max-w-2xl mx-auto ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
          >
            {/* ── STEP 1: PERSONAL ── */}
            {step === 1 && (
              <Card titleHe={t.step_personal} titleEn="Personal Information" dir={dir}>
                <Inp label={t.f_name_he} k="fullNameHe" {...fp} />
                <Inp label={t.f_name_en} k="fullNameEn" {...fp} />
                <Inp label={t.f_phone} k="phone" type="tel" {...fp} />
                <Inp label={t.f_email} k="email" type="email" {...fp} />
                <Inp label={t.f_dob} k="dob" type="date" {...fp} />
                <Sel label={t.f_country} k="country" placeholder={t.f_select} opts={COUNTRIES.map(c => ({ v: c, l: c }))} {...fp} />
                <Sel label={t.f_city} k="city" placeholder={t.f_select} opts={CITIES.map(c => ({ v: c, l: c }))} {...fp} />
              </Card>
            )}

            {/* ── STEP 2: WORK ── */}
            {step === 2 && (
              <Card titleHe={t.step_work} titleEn="Professional Details" dir={dir}>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                  <p className="text-gray-700">{t.work_note}</p>
                </div>
                <Sel label={t.f_sector} k="sector" placeholder={t.f_select} opts={SECTORS.map(s => ({ v: s.v, l: `${s.he} / ${s.en}` }))} {...fp} />
                <Field label={t.f_profession} error={errors.profession}>
                  <select
                    value={form.profession || ''}
                    onChange={e => set('profession', e.target.value)}
                    disabled={!form.sector}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-2xl text-gray-900 transition-all duration-300 ${
                      !form.sector ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">{form.sector ? t.f_select : t.f_profession_first}</option>
                    {(PROFESSIONS[form.sector] || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Inp label={t.f_experience} k="experience" type="number" {...fp} />
                <Inp label={t.f_employer_current} k="currentEmployer" {...fp} />
                <Inp label={t.f_employer_last} k="lastEmployer" {...fp} />
              </Card>
            )}

            {/* ── STEP 3: VISA ── */}
            {step === 3 && (
              <Card titleHe={t.step_visa} titleEn="Legal Status & Permits" dir={dir}>
                <Sel label={t.f_permit_type} k="permitType" placeholder={t.f_select} opts={PERMITS.map(p => ({ v: p.v, l: p.l }))} {...fp} />
                <Inp label={t.f_permit_number} k="permitNumber" {...fp} />
                <Inp label={t.f_permit_expiry} k="permitExpiry" type="date" {...fp} />
                <Inp label={t.f_entry_date} k="entryDate" type="date" {...fp} />
              </Card>
            )}

            {/* ── STEP 4: DOCS ── */}
            {step === 4 && (
              <Card titleHe={t.step_docs} titleEn="Document Uploads" dir={dir}>
                <p className="text-gray-600 mb-6">{t.docs_note}</p>
                {DOC_FIELDS.map(d => (
                  <FileField key={d.k} label={t[`f_doc_${d.k}`] || d.he} name={d.k} file={files[d.k]} onChange={setF} t={t} />
                ))}
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between max-w-2xl mx-auto mt-8">
          {step > 1 && (
            <motion.button
              onClick={back}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t.btn_back || 'Back'}
            </motion.button>
          )}
          {step < 4 ? (
            <motion.button
              onClick={next}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-700 ml-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t.btn_next || 'Next'}
            </motion.button>
          ) : (
            <motion.button
              onClick={submit}
              disabled={saving}
              className="px-8 py-4 bg-green-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-green-700 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {saving ? t.btn_saving || 'Submitting...' : t.btn_submit || 'Submit'}
            </motion.button>
          )}
        </div>
        {saveError && <div className="text-red-500 text-center mt-4">{saveError}</div>}
      </div>
    </div>
  )
}