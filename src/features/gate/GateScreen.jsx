import { useState, useEffect } from 'react'
import { T } from '../../translations.js'

const F    = "'Heebo', -apple-system, 'Arial Hebrew', Arial, sans-serif"
const BLUE = '#0071E3'
const DARK = '#1D1D1F'
const GRAY = '#6E6E73'

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById('gate-styles')) return
    const s = document.createElement('style')
    s.id = 'gate-styles'
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
      @keyframes gFadeUp    { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
      @keyframes gFadeIn    { from { opacity:0; } to { opacity:1; } }
      @keyframes gScaleIn   { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      @keyframes gFloat     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
      @keyframes gPulse     { 0%,100% { box-shadow: 0 0 0 0 rgba(0,113,227,0.3); } 50% { box-shadow: 0 0 0 12px rgba(0,113,227,0); } }
      .g-a1 { animation: gFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both 0.05s; }
      .g-a2 { animation: gFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both 0.15s; }
      .g-a3 { animation: gFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both 0.25s; }
      .g-a4 { animation: gFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both 0.35s; }
      .g-a5 { animation: gFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both 0.45s; }
      .g-float  { animation: gFloat 4s ease-in-out infinite; }
      .g-fade-in { animation: gFadeIn 0.4s ease both; }
      .g-lang-btn {
        width:100%; padding:18px 20px; background:white; border:1.5px solid #D2D2D7;
        border-radius:16px; display:flex; align-items:center; gap:16px; cursor:pointer;
        font-family:inherit; transition:all 0.22s cubic-bezier(0.22,1,0.36,1); text-align:right;
      }
      .g-lang-btn:hover { border-color:${BLUE}; background:rgba(0,113,227,0.04); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,113,227,0.12); }
      .g-btn-yes {
        padding:16px 36px; background:${BLUE}; color:white; border:none; border-radius:980px;
        font-size:17px; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.2s;
        box-shadow:0 2px 16px rgba(0,113,227,0.3); letter-spacing:-0.2px;
        animation: gPulse 2.5s ease-in-out infinite;
      }
      .g-btn-yes:hover { background:#0077ED; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,113,227,0.4); }
      .g-btn-no {
        padding:16px 28px; background:#F5F5F7; color:${GRAY}; border:none; border-radius:980px;
        font-size:17px; font-weight:500; font-family:inherit; cursor:pointer; transition:all 0.2s;
      }
      .g-btn-no:hover { background:#EBEBF0; }
      .g-card { background:white; border-radius:20px; box-shadow:0 1px 0 rgba(0,0,0,0.06),0 4px 24px rgba(0,0,0,0.07); }
      .g-about-card {
        background:white; border-radius:16px; padding:20px; display:flex; gap:16px;
        align-items:flex-start; transition:all 0.22s;
        box-shadow:0 1px 0 rgba(0,0,0,0.04),0 2px 12px rgba(0,0,0,0.05);
      }
      .g-about-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.1); }
    `
    document.head.appendChild(s)
  }, [])
}

// ── GOODBYE COPY (per language) ───────────────────────────────────────────────
const GOODBYE = {
  he: {
    dir: 'rtl',
    icon: '👋',
    title: 'נעים שהכרנו',
    subtitle: 'צר לנו שבחרת שלא להמשיך',
    body: 'מבינים שהתזמון לא תמיד מתאים. אם תשנה את דעתך בעתיד — אנחנו כאן, ואנחנו שמחים לעזור.',
    promise: 'מקווים לראותך בהמשך 🤝',
    returnBtn: 'חזור לעמוד הראשי',
    returnLabel: 'שינית את דעתך?',
  },
  en: {
    dir: 'ltr',
    icon: '👋',
    title: 'Nice to meet you',
    subtitle: "We're sorry to see you go",
    body: "We understand timing isn't always right. If you change your mind in the future — we're here and happy to help.",
    promise: 'Hope to see you again 🤝',
    returnBtn: 'Back to main page',
    returnLabel: 'Changed your mind?',
  },
  ar: {
    dir: 'rtl',
    icon: '👋',
    title: 'سعداء بمعرفتك',
    subtitle: 'نأسف لأنك اخترت عدم المتابعة',
    body: 'نتفهم أن التوقيت لا يكون مناسباً دائماً. إذا غيّرت رأيك في المستقبل — نحن هنا وسعداء بمساعدتك.',
    promise: 'نأمل أن نراك مجدداً 🤝',
    returnBtn: 'العودة إلى الصفحة الرئيسية',
    returnLabel: 'هل غيّرت رأيك؟',
  },
}

// ── GOODBYE SCREEN ────────────────────────────────────────────────────────────
function GoodbyeScreen({ lang, onReturn }) {
  useGlobalStyles()
  const g = GOODBYE[lang] || GOODBYE.he

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#F5F5F7 0%,#FFFFFF 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: F, direction: g.dir,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div className="g-a1">
          <div className="g-float" style={{
            width: 80, height: 80, borderRadius: 22,
            background: '#F5F5F7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', fontSize: 44,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {g.icon}
          </div>
        </div>

        {/* Title */}
        <div className="g-a2">
          <h1 style={{
            fontSize: 'clamp(36px,7vw,52px)', fontWeight: 800, color: DARK,
            letterSpacing: '-1px', lineHeight: 1.05, marginBottom: 10,
          }}>
            {g.title}
          </h1>
          <p style={{ fontSize: 18, color: GRAY, fontWeight: 400, marginBottom: 28 }}>
            {g.subtitle}
          </p>
        </div>

        {/* Body card */}
        <div className="g-a3 g-card" style={{ padding: '22px 26px', marginBottom: 28, textAlign: g.dir === 'rtl' ? 'right' : 'left' }}>
          <p style={{ fontSize: 16, color: DARK, lineHeight: 1.8, marginBottom: 14 }}>
            {g.body}
          </p>
          <p style={{ fontSize: 15, color: BLUE, fontWeight: 600 }}>
            {g.promise}
          </p>
        </div>

        {/* Return CTA */}
        <div className="g-a4">
          <p style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 12 }}>{g.returnLabel}</p>
          <button
            onClick={onReturn}
            style={{
              padding: '14px 32px', background: '#F5F5F7', color: DARK,
              border: '1.5px solid #D2D2D7', borderRadius: 980,
              fontSize: 15, fontWeight: 600, fontFamily: F,
              cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EBEBF0'; e.currentTarget.style.borderColor = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.borderColor = '#D2D2D7' }}
          >
            ← {g.returnBtn}
          </button>
        </div>

        <p className="g-a5" style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#C7C7CC' }}>
          Oz Hadar Group · Foreign Worker Recruitment
        </p>
      </div>
    </div>
  )
}

// ── LANGUAGE PICKER ───────────────────────────────────────────────────────────
function LangPicker({ onSelect }) {
  useGlobalStyles()
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F5F5F7 0%,#FFFFFF 70%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:F }}>
      <div style={{ maxWidth:400, width:'100%' }}>
        <div className="g-a1" style={{ textAlign:'center', marginBottom:40 }}>
          <div className="g-float" style={{ width:72, height:72, borderRadius:20, background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 28px rgba(0,113,227,0.3)', fontSize:32 }}>
            🌐
          </div>
          <div style={{ display:'inline-block', background:'white', border:'1px solid #D2D2D7', borderRadius:980, padding:'6px 18px', fontSize:13, color:GRAY, fontWeight:500, marginBottom:20 }}>
            Oz Hadar Group
          </div>
          <h1 className="g-a2" style={{ fontSize:40, fontWeight:800, color:DARK, letterSpacing:'-1px', lineHeight:1.05, marginBottom:10 }}>
            בחר שפה
          </h1>
          <p className="g-a3" style={{ fontSize:16, color:GRAY, fontWeight:400 }}>
            Select language &nbsp;·&nbsp; اختر اللغة
          </p>
        </div>

        <div className="g-a4" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            ['he','🇮🇱','עברית','Hebrew'],
            ['en','🇬🇧','English','English'],
            ['ar','🇸🇦','العربية','Arabic'],
          ].map(([code, flag, native, latin]) => (
            <button key={code} className="g-lang-btn" onClick={() => onSelect(code)}>
              <span style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{flag}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:700, color:DARK }}>{native}</div>
                <div style={{ fontSize:13, color:GRAY, marginTop:2 }}>{latin}</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 5L13 10L8 15" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        <div className="g-a5" style={{ textAlign:'center', marginTop:28, fontSize:12, color:'#C7C7CC' }}>
          Oz Hadar Group · Foreign Worker Recruitment
        </div>
      </div>
    </div>
  )
}

// ── GATE SCREEN ───────────────────────────────────────────────────────────────
export function GateScreen({ onYes, onNo, lang, onChangeLang }) {
  useGlobalStyles()
  const t = T[lang] || T.he
  const rtl = t.dir === 'rtl'

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F5F5F7 0%,#FFFFFF 70%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:F, direction:t.dir }}>
      <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>

        <div className="g-a1">
          <div className="g-float" style={{ width:80, height:80, borderRadius:22, background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', boxShadow:'0 8px 28px rgba(0,113,227,0.3)', fontSize:38 }}>
            💼
          </div>
        </div>

        <div className="g-a2">
          <h1 style={{ fontSize:'clamp(40px,8vw,64px)', fontWeight:800, color:DARK, letterSpacing:'-1.5px', lineHeight:1.0, marginBottom:16 }}>
            {t.gate_headline}
          </h1>
        </div>

        <div className="g-a3">
          <p style={{ fontSize:18, color:GRAY, lineHeight:1.65, marginBottom:8, fontWeight:400 }}>{t.gate_sub}</p>
          <p style={{ fontSize:15, color:'#AEAEB2', lineHeight:1.65, marginBottom:32 }}>{t.gate_sub2}</p>
        </div>

        <div className="g-a4 g-card" style={{ padding:'18px 22px', marginBottom:36, textAlign: rtl ? 'right' : 'left' }}>
          <div style={{ fontSize:14, fontWeight:700, color:BLUE, marginBottom:6 }}>{t.gate_noexp_title}</div>
          <div style={{ fontSize:14, color:GRAY, lineHeight:1.65 }}>{t.gate_noexp_body}</div>
        </div>

        <div className="g-a5" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:24 }}>
          <button className="g-btn-yes" onClick={onYes}>{t.gate_yes}</button>
          {/* ← כפתור לא תודה עם onNo */}
          <button className="g-btn-no" onClick={onNo}>{t.gate_no}</button>
        </div>

        <div className="g-fade-in" style={{ marginTop:8 }}>
          <button onClick={onChangeLang} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#AEAEB2', fontFamily:F, textDecoration:'underline' }}>
            {t.gate_change_lang}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ABOUT SCREEN ──────────────────────────────────────────────────────────────
export function AboutScreen({ onContinue, lang }) {
  useGlobalStyles()
  const t = T[lang] || T.he
  const rtl = t.dir === 'rtl'
  const CARD_COLORS = [
    { bg:'#FFF9ED', icon:'#C9973A' },
    { bg:'#EDFAF4', icon:'#1A7F4B' },
    { bg:'#EDF4FF', icon:'#1A5FBF' },
    { bg:'#FFF0F0', icon:'#BF3A3A' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F5F5F7 0%,#FFFFFF 50%)', fontFamily:F, direction:t.dir, padding:'48px 20px 80px' }}>
      <div style={{ maxWidth:560, margin:'0 auto' }}>

        <div className="g-a1" style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'white', border:'1px solid #D2D2D7', borderRadius:980, padding:'8px 18px', marginBottom:24, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ width:28, height:28, borderRadius:8, background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'white' }}>OZ</div>
            <span style={{ fontSize:14, fontWeight:600, color:DARK }}>{t.about_badge}</span>
          </div>
          <h1 style={{ fontSize:'clamp(34px,6vw,52px)', fontWeight:800, color:DARK, letterSpacing:'-1px', lineHeight:1.05, marginBottom:12 }}>
            {t.about_headline}<br/>
            <span style={{ color:BLUE }}>{t.about_headline2}</span>
          </h1>
        </div>

        <div className="g-a2 g-card" style={{ padding:'22px 24px', marginBottom:24 }}>
          <p style={{ fontSize:16, color:GRAY, lineHeight:1.8, textAlign: rtl ? 'right' : 'left' }}>{t.about_body}</p>
        </div>

        <div className="g-a3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:32 }}>
          {t.about_cards.map(([icon, title, desc], i) => (
            <div key={i} className="g-about-card" style={{ background: CARD_COLORS[i].bg, flexDirection:'column', gap:10 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:DARK, marginBottom:4 }}>{title}</div>
                <div style={{ fontSize:13, color:GRAY, lineHeight:1.55 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="g-a4">
          <button onClick={onContinue} className="g-btn-yes" style={{ width:'100%', padding:18, fontSize:18, borderRadius:16, boxShadow:'0 4px 20px rgba(0,113,227,0.28)' }}>
            {t.about_cta}
          </button>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#C7C7CC' }}>{t.footer}</p>
      </div>
    </div>
  )
}

// ── ROOT FLOW ─────────────────────────────────────────────────────────────────
export function GateFlow({ onYes }) {
  const [stage, setStage] = useState('pick')
  const [lang, setLang]   = useState('he')

  const selectLang = (l) => { setLang(l); setStage('gate') }

  if (stage === 'pick')    return <LangPicker onSelect={selectLang} />
  if (stage === 'gate')    return <GateScreen lang={lang} onYes={() => setStage('about')} onNo={() => setStage('goodbye')} onChangeLang={() => setStage('pick')} />
  if (stage === 'about')   return <AboutScreen lang={lang} onContinue={() => onYes(lang)} />
  if (stage === 'goodbye') return <GoodbyeScreen lang={lang} onReturn={() => setStage('gate')} />
}
