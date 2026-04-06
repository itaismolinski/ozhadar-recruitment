import { useState } from 'react';
import { insertCandidate, uploadDoc } from '../lib/supabase.js';
import { SECTORS, PROFESSIONS, PERMITS, COUNTRIES, CITIES, DOC_FIELDS, EMPTY_FORM } from '../constants.js';
import { T } from '../translations.js';

export default function RegistrationForm({ lang = 'he', onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState({ passport: null, permit: null, license: null, other: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState('');

  const t = T[lang] || T.he;
  const dir = t.dir || 'rtl';

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const updateFile = (key, file) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.fullNameHe && !form.fullNameEn) newErrors.fullNameHe = t.f_required || 'שדה חובה';
      if (!form.phone) newErrors.phone = t.f_required || 'שדה חובה';
    }
    if (currentStep === 3 && !form.permitType) newErrors.permitType = t.f_required || 'שדה חובה';
    return newErrors;
  };

  const nextStep = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');
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
      };

      const candidate = await insertCandidate(record);
      for (const [field, file] of Object.entries(files)) {
        if (file) await uploadDoc(candidate.id, field, file);
      }
      setDone(true);
    } catch (err) {
      setSaveError('שגיאה בשמירה. נסה שוב.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Success Screen
  if (done) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6" dir={dir}>
        <div className="bg-white rounded-3xl shadow-2xl p-16 max-w-md text-center border border-gray-100">
          <div className="text-7xl mb-8 text-emerald-600">✓</div>
          <h2 className="text-5xl font-semibold text-gray-900 tracking-tighter mb-4">הרשמה הושלמה</h2>
          <p className="text-xl text-gray-600 mb-10">תודה רבה!<br />הפרטים נשמרו בהצלחה.<br />ניצור איתך קשר בקרוב.</p>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setFiles({ passport: null, permit: null, license: null, other: null });
              setErrors({});
              setDone(false);
              setStep(1);
              if (onDone) onDone();
            }}
            className="w-full py-5 bg-black hover:bg-gray-900 text-white font-semibold rounded-2xl text-lg transition-all"
          >
            הרשמה חדשה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-16 px-4" dir={dir}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-semibold text-gray-900 tracking-tighter mb-4">בוא נכיר אותך</h1>
          <p className="text-2xl text-gray-600">מלא את הפרטים ונמצא לך את ההזדמנות המתאימה</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-16">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${step * 25}%` }}
            />
          </div>
          <div className="flex justify-between mt-6 text-sm font-medium text-gray-500">
            {[t.step_personal, t.step_work, t.step_visa, t.step_docs].map((label, i) => (
              <div key={i} className={step === i + 1 ? 'text-blue-600 font-semibold' : ''}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 md:p-16">
          
          {/* STEP 1 - Personal Information */}
          {step === 1 && (
            <div className="space-y-10">
              <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">פרטים אישיים</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא בעברית</label>
                  <input
                    type="text"
                    value={form.fullNameHe || ''}
                    onChange={(e) => updateField('fullNameHe', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all"
                    placeholder="שם מלא"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name (English)</label>
                  <input
                    type="text"
                    value={form.fullNameEn || ''}
                    onChange={(e) => updateField('fullNameEn', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all"
                  placeholder="050-1234567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                  <input type="email" value={form.email || ''} onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך לידה</label>
                  <input type="date" value={form.dob || ''} onChange={(e) => updateField('dob', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מדינה</label>
                  <select value={form.country || ''} onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all">
                    <option value="">בחר מדינה</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">עיר</label>
                  <select value={form.city || ''} onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all">
                    <option value="">בחר עיר</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - Professional Details */}
          {step === 2 && (
            <div className="space-y-10">
              <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">פרטים מקצועיים</h2>
              
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-blue-800">
                {t.work_note}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תחום עיסוק</label>
                <select value={form.sector || ''} onChange={(e) => updateField('sector', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all">
                  <option value="">בחר תחום</option>
                  {SECTORS.map(s => <option key={s.v} value={s.v}>{s.he} / {s.en}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מקצוע</label>
                <select value={form.profession || ''} onChange={(e) => updateField('profession', e.target.value)}
                  disabled={!form.sector}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all disabled:opacity-50">
                  <option value="">{form.sector ? 'בחר מקצוע' : 'בחר תחום קודם'}</option>
                  {(PROFESSIONS[form.sector] || []).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שנות ניסיון</label>
                  <input type="number" value={form.experience || ''} onChange={(e) => updateField('experience', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מעסיק נוכחי</label>
                  <input type="text" value={form.currentEmployer || ''} onChange={(e) => updateField('currentEmployer', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מעסיק קודם</label>
                <input type="text" value={form.lastEmployer || ''} onChange={(e) => updateField('lastEmployer', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
              </div>
            </div>
          )}

          {/* STEP 3 - Visa & Permits */}
          {step === 3 && (
            <div className="space-y-10">
              <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">סטטוס משפטי ואשרות</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סוג אשרה</label>
                <select value={form.permitType || ''} onChange={(e) => updateField('permitType', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all">
                  <option value="">בחר סוג אשרה</option>
                  {PERMITS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מספר אשרה</label>
                  <input type="text" value={form.permitNumber || ''} onChange={(e) => updateField('permitNumber', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך תפוגה</label>
                  <input type="date" value={form.permitExpiry || ''} onChange={(e) => updateField('permitExpiry', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תאריך כניסה לישראל</label>
                <input type="date" value={form.entryDate || ''} onChange={(e) => updateField('entryDate', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-lg outline-none transition-all" />
              </div>
            </div>
          )}

          {/* STEP 4 - Documents */}
          {step === 4 && (
            <div className="space-y-10">
              <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">העלאת מסמכים</h2>
              <p className="text-gray-600 text-lg">{t.docs_note}</p>

              {DOC_FIELDS.map((d) => (
                <div key={d.k} className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t[`f_doc_${d.k}`] || d.he}</label>
                  <div
                    onClick={() => document.getElementById(`file_${d.k}`).click()}
                    className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all hover:border-blue-400 ${files[d.k] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-6xl mb-4">{files[d.k] ? '✅' : '📤'}</div>
                    <div className="font-medium text-xl mb-1">
                      {files[d.k] ? files[d.k].name : 'לחץ להעלאת קובץ'}
                    </div>
                    <div className="text-sm text-gray-500">PDF, JPG, PNG • עד 25MB</div>
                  </div>
                  <input
                    id={`file_${d.k}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.size > 25 * 1024 * 1024) {
                        alert('הקובץ גדול מדי (מקסימום 25MB)');
                        return;
                      }
                      updateFile(d.k, file);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-5 mt-16">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-5 border border-gray-300 rounded-2xl font-medium text-lg hover:bg-gray-50 transition-all"
              >
                חזור
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex-1 py-5 bg-black text-white font-semibold rounded-2xl text-lg hover:bg-gray-900 transition-all"
              >
                המשך
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-5 bg-black text-white font-semibold rounded-2xl text-lg hover:bg-gray-900 transition-all disabled:opacity-70"
              >
                {saving ? 'שומר...' : 'שלח את הטופס'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}