import { T } from '../../translations.js'

const SANS    = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"
const BG = {
  minHeight: 'calc(100vh - 0px)',
  background: 'linear-gradient(160deg, #ecfdf9 0%, #fffcf5 50%, #eff6ff 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '44px 20px', position: 'relative', overflow: 'hidden',
  fontFamily: SANS,
}

function useStyles() {
  useEffect(() => {
    if (!document.getElementById('oz-fonts')) {
      const l = document.createElement('link')
      l.id = 'oz-fonts'; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap'
      document.head.appendChild(l)
    }
    if (!document.getElementById('oz-css')) {
      const s = document.createElement('style'); s.id = 'oz-css'
      s.textContent = `
        @keyframes oz-fu{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes oz-fp{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .oz-a1{animation:oz-fu .5s ease both .08s}.oz-a2{animation:oz-fu .5s ease both .2s}
        .oz-a3{animation:oz-fu .5s ease both .32s}.oz-a4{animation:oz-fu .5s ease both .46s}
        .oz-float{animation:oz-fp 3s ease-in-out infinite}
        .oz-btn-main:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(15,118,110,.38)!important}
        .oz-lang-btn:hover{border-color:#0F766E!important;background:#F0FDF9!important}
        .oz-card-h:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)!important}
      `
      document.head.appendChild(s)
    }
  }, [])
}

// ─── LANGUAGE PICKER ─────────────────────────────────────────────────────────
function LangPicker({ onSelect }) {
  return (
    <div style={BG}>
      <div style={{position:'absolute',top:-90,right:-90,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(15,118,110,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-70,left:-70,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{maxWidth:380,width:'100%',textAlign:'center',position:'relative',zIndex:1}}>
        <div className="oz-a1 oz-float" style={{width:76,height:76,borderRadius:20,background:'linear-gradient(135deg,#0F766E,#14B8A6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,margin:'0 auto 22px',boxShadow:'0 8px 26px rgba(15,118,110,.28)'}}>🌐</div>
        <div className="oz-a2" style={{fontFamily:DISPLAY,fontSize:26,fontWeight:800,color:'#0F172A',marginBottom:6}}>Oz Hadar Group</div>
        <div className="oz-a2" style={{fontSize:13,color:'#9CA3AF',marginBottom:34,letterSpacing:'.3px'}}>
          Select language &nbsp;·&nbsp; בחר שפה &nbsp;·&nbsp; اختر اللغة
        </div>
        <div className="oz-a3" style={{display:'flex',flexDirection:'column',gap:11}}>
          {[
            ['he','🇮🇱','עברית','Hebrew'],
            ['en','🇬🇧','English','English'],
            ['ar','🇸🇦','العربية','Arabic — عربي'],
          ].map(([code, flag, native, latin]) => (
            <button key={code} onClick={() => onSelect(code)} className="oz-lang-btn"
              style={{width:'100%',padding:'15px 20px',background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:12,display:'flex',alignItems:'center',gap:14,cursor:'pointer',fontFamily:SANS,transition:'all .2s',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
              <span style={{fontSize:28,lineHeight:1,flexShrink:0}}>{flag}</span>
              <div style={{flex:1,textAlign:code==='en'?'left':'right'}}>
                <div style={{fontSize:16,fontWeight:700,color:'#111827',fontFamily:DISPLAY}}>{native}</div>
                <div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>{latin}</div>
              </div>
              <span style={{color:'#D1D5DB',fontSize:16}}>{code==='en'?'→':'←'}</span>
            </button>
          ))}
        </div>
        <div className="oz-a4" style={{marginTop:24,fontSize:10,color:'#D1D5DB',letterSpacing:'1px',textTransform:'uppercase'}}>
          Oz Hadar Group · Foreign Worker Recruitment
        </div>
      </div>
    </div>
  )
}

// ─── GATE SCREEN ─────────────────────────────────────────────────────────────
export function GateScreen({ onYes, lang, onChangeLang }) {
  useStyles()
  const t = T[lang] || T.he
  return (
    <div style={{...BG, direction:t.dir}}>
      <div style={{position:'absolute',top:-90,right:-90,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(15,118,110,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-70,left:-70,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{maxWidth:420,width:'100%',textAlign:'center',position:'relative',zIndex:1}}>
        <div className="oz-a1 oz-float" style={{width:80,height:80,borderRadius:22,background:'linear-gradient(135deg,#0F766E,#14B8A6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,margin:'0 auto 26px',boxShadow:'0 8px 26px rgba(15,118,110,.28)'}}>💼</div>

        <h1 className="oz-a2" style={{fontFamily:DISPLAY,fontSize:'clamp(34px,8vw,50px)',fontWeight:800,color:'#0F172A',lineHeight:1.08,marginBottom:12,letterSpacing:'-.5px'}}>
          {t.gate_headline}
        </h1>
        <p className="oz-a3" style={{fontSize:15,color:'#374151',lineHeight:1.8,marginBottom:4,fontWeight:500}}>{t.gate_sub}</p>
        <p className="oz-a3" style={{fontSize:13,color:'#9CA3AF',lineHeight:1.8,marginBottom:24}}>{t.gate_sub2}</p>

        <div className="oz-a3" style={{background:'#f0fdf4',border:'1.5px solid #bbf7d0',borderRadius:12,padding:'13px 16px',marginBottom:26,textAlign:t.dir==='rtl'?'right':'left'}}>
          <p style={{fontSize:13,fontWeight:700,color:'#0F766E',marginBottom:5}}>{t.gate_noexp_title}</p>
          <p style={{fontSize:12,color:'#4B5563',lineHeight:1.7}}>{t.gate_noexp_body}</p>
        </div>

        <div className="oz-a4" style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onYes} className="oz-btn-main"
            style={{background:'#0F766E',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',padding:'14px 30px',fontFamily:SANS,transition:'all .2s',boxShadow:'0 4px 18px rgba(15,118,110,.25)'}}>
            {t.gate_yes}
          </button>
          <button style={{background:'#fff',color:'#9CA3AF',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,fontWeight:500,cursor:'default',padding:'14px 18px',fontFamily:SANS}}>
            {t.gate_no}
          </button>
        </div>

        <button onClick={onChangeLang}
          style={{marginTop:20,background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#9CA3AF',fontFamily:SANS,textDecoration:'underline',display:'block',margin:'18px auto 0'}}>
          {t.gate_change_lang}
        </button>
        <p style={{marginTop:12,fontSize:10,color:'#D1D5DB',letterSpacing:'1px',textTransform:'uppercase'}}>{t.footer}</p>
      </div>
    </div>
  )
}

// ─── ABOUT SCREEN ─────────────────────────────────────────────────────────────
export function AboutScreen({ onContinue, lang }) {
  useStyles()
  const t = T[lang] || T.he
  return (
    <div style={{...BG, direction:t.dir, alignItems:'flex-start', paddingTop:32}}>
      <div style={{maxWidth:540,width:'100%',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:12,padding:'9px 16px',marginBottom:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
            <div style={{width:32,height:32,background:'linear-gradient(135deg,#0F766E,#14B8A6)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:12,color:'#fff',fontFamily:SANS}}>OZ</div>
            <div style={{textAlign:t.dir==='rtl'?'right':'left'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#111827',fontFamily:SANS}}>{t.about_badge}</div>
              <div style={{fontSize:10,color:'#9CA3AF',fontFamily:SANS}}>Oz Hadar Group</div>
            </div>
          </div>
          <h2 style={{fontFamily:DISPLAY,fontSize:'clamp(24px,5vw,34px)',fontWeight:800,color:'#0F172A',marginBottom:4}}>{t.about_headline}</h2>
          <p style={{fontSize:14,color:'#9CA3AF',fontFamily:SANS}}>{t.about_headline2}</p>
        </div>

        <div style={{background:'#fff',border:'1.5px solid #F3F4F6',borderRadius:14,padding:'16px 18px',marginBottom:12,boxShadow:'0 1px 6px rgba(0,0,0,.04)',direction:t.dir}}>
          <p style={{fontSize:14,color:'#374151',lineHeight:1.9,fontFamily:SANS}}>{t.about_body}</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:18}}>
          {t.about_cards.map(([icon, title, desc], i) => {
            const colors = [
              {bg:'#fefce8',bc:'#fef08a',cl:'#92400E'},
              {bg:'#f0fdf4',bc:'#bbf7d0',cl:'#065F46'},
              {bg:'#eff6ff',bc:'#bfdbfe',cl:'#1E40AF'},
              {bg:'#fff1f2',bc:'#fecdd3',cl:'#9F1239'},
            ][i]
            return (
              <div key={i} className="oz-card-h" style={{background:colors.bg,border:`1.5px solid ${colors.bc}`,borderRadius:13,padding:13,transition:'all .2s',boxShadow:'0 1px 4px rgba(0,0,0,.03)'}}>
                <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:'#1C1917',fontFamily:SANS}}>{title}</div>
                <div style={{fontSize:10,color:colors.cl,fontWeight:600,marginBottom:5,fontFamily:SANS,textTransform:'uppercase',letterSpacing:'.3px'}}>{icon}</div>
                <div style={{fontSize:11,color:'#6B7280',lineHeight:1.5,direction:t.dir,fontFamily:SANS}}>{desc}</div>
              </div>
            )
          })}
        </div>

        <button onClick={onContinue} className="oz-btn-main"
          style={{width:'100%',padding:15,background:'#0F766E',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:SANS,boxShadow:'0 4px 18px rgba(15,118,110,.22)',transition:'all .2s'}}>
          {t.about_cta}
        </button>
      </div>
    </div>
  )
}

// ─── ROOT COMPONENT (manages lang state) ────────────────────────────────────
export function GateFlow({ onYes }) {
  const [stage, setStage] = useState('pick')  // pick | gate | about
  const [lang, setLang]   = useState('he')

  const selectLang = (l) => { setLang(l); setStage('gate') }

  if (stage === 'pick')  return <LangPicker onSelect={selectLang} />
  if (stage === 'gate')  return <GateScreen lang={lang} onYes={() => setStage('about')} onChangeLang={() => setStage('pick')} />
  if (stage === 'about') return <AboutScreen lang={lang} onContinue={() => onYes(lang)} />
}
