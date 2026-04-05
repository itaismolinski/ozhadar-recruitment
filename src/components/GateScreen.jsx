import { useEffect } from 'react'

function useStyles() {
  useEffect(() => {
    if (!document.getElementById('oz-fonts')) {
      const l = document.createElement('link')
      l.id = 'oz-fonts'
      l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap'
      document.head.appendChild(l)
    }
    if (!document.getElementById('oz-css')) {
      const s = document.createElement('style')
      s.id = 'oz-css'
      s.textContent = `
        @keyframes oz-fu { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes oz-fp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .oz-a1{animation:oz-fu .55s ease both .08s}
        .oz-a2{animation:oz-fu .55s ease both .2s}
        .oz-a3{animation:oz-fu .55s ease both .34s}
        .oz-a4{animation:oz-fu .55s ease both .48s}
        .oz-float{animation:oz-fp 3s ease-in-out infinite}
        .oz-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(15,118,110,.38) !important}
        .oz-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1) !important}
      `
      document.head.appendChild(s)
    }
  }, [])
}

const SANS = "'Outfit', system-ui, Arial, sans-serif"
const DISPLAY = "'Syne', 'Outfit', Arial, sans-serif"
const BG = {
  minHeight: 'calc(100vh - 62px)',
  background: 'linear-gradient(160deg, #ecfdf9 0%, #fffcf5 50%, #eff6ff 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '44px 20px', position: 'relative', overflow: 'hidden',
  fontFamily: SANS,
}

export function GateScreen({ onYes }) {
  useStyles()
  return (
    <div style={BG}>
      <div style={{position:'absolute',top:-90,right:-90,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(15,118,110,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-70,left:-70,width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{maxWidth:420,width:'100%',textAlign:'center',position:'relative',zIndex:1}}>

        <div className="oz-a1 oz-float" style={{width:84,height:84,borderRadius:24,background:'linear-gradient(135deg,#0F766E,#14B8A6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,margin:'0 auto 28px',boxShadow:'0 8px 28px rgba(15,118,110,.28)'}}>💼</div>

        <h1 className="oz-a2" style={{fontFamily:DISPLAY,fontSize:'clamp(38px,8vw,52px)',fontWeight:800,color:'#0F172A',lineHeight:1.05,marginBottom:12,letterSpacing:'-.5px'}}>
          מחפש עבודה?
        </h1>
        <p className="oz-a2" style={{fontSize:19,color:'#6B7280',marginBottom:18,fontWeight:500}}>
          Looking for a job?
        </p>

        <p className="oz-a3" style={{fontSize:15,color:'#374151',lineHeight:1.8,marginBottom:5,fontWeight:500}}>
          יש לנו עבודה — בנייה, תעשייה, מסחר וחקלאות
        </p>
        <p className="oz-a3" style={{fontSize:13,color:'#9CA3AF',lineHeight:1.8,marginBottom:26}}>
          We have jobs — construction, industry, commerce &amp; agriculture
        </p>

        <div className="oz-a3" style={{background:'#f0fdf4',border:'1.5px solid #bbf7d0',borderRadius:14,padding:'14px 18px',marginBottom:28,textAlign:'right'}}>
          <p style={{fontSize:13,fontWeight:700,color:'#0F766E',marginBottom:6}}>
            💡 אין לך ניסיון מקצועי? לא משנה
          </p>
          <p style={{fontSize:12,color:'#4B5563',lineHeight:1.7,direction:'rtl'}}>
            אם אינך מוצא את תחום עיסוקך — מלא את הפרטים האישיים בלבד.
          </p>
          <div style={{borderTop:'1px solid #bbf7d0',marginTop:10,paddingTop:10,direction:'ltr',textAlign:'left'}}>
            <p style={{fontSize:12,color:'#9CA3AF',lineHeight:1.7}}>
              No experience in our fields? Just fill in personal details and we'll reach out.
            </p>
          </div>
        </div>

        <div className="oz-a4" style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onYes} className="oz-btn"
            style={{background:'#0F766E',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',padding:'14px 32px',fontFamily:SANS,transition:'all .2s',boxShadow:'0 4px 18px rgba(15,118,110,.25)'}}>
            כן, אני מחפש עבודה ✓
          </button>
          <button style={{background:'#fff',color:'#9CA3AF',border:'1.5px solid #E5E7EB',borderRadius:12,fontSize:14,fontWeight:500,cursor:'default',padding:'14px 20px',fontFamily:SANS}}>
            לא תודה
          </button>
        </div>

        <p className="oz-a4" style={{marginTop:26,fontSize:10,color:'#D1D5DB',letterSpacing:'1.2px',textTransform:'uppercase'}}>
          Oz Hadar Group · Foreign Worker Recruitment
        </p>
      </div>
    </div>
  )
}

export function AboutScreen({ onContinue }) {
  useStyles()

  const cards = [
    { icon:'⚖️', he:'זכויות מלאות',  en:'Full rights',     bg:'#fefce8', bc:'#fef08a', cl:'#92400E', dh:'שכר הוגן, ביטוח וחופשות לפי חוק.', de:'Fair wages, insurance & leave by law.' },
    { icon:'📋', he:'ניירת — עלינו', en:'Paperwork on us', bg:'#f0fdf4', bc:'#bbf7d0', cl:'#065F46', dh:'היתר, ויזה, רשויות — אנחנו מטפלים.', de:'Permit, visa, authorities — handled.' },
    { icon:'🏠', he:'סיוע בדיור',    en:'Housing support', bg:'#eff6ff', bc:'#bfdbfe', cl:'#1E40AF', dh:'נסייע למצוא דיור קרוב לעבודה.', de:'Help finding housing near work.' },
    { icon:'📞', he:'תמיד זמינים',   en:'Always available',bg:'#fff1f2', bc:'#fecdd3', cl:'#9F1239', dh:'נציג שדובר את שפתך, בכל עת.', de:'A rep in your language, any time.' },
  ]

  return (
    <div style={BG}>
      <div style={{position:'absolute',top:-80,left:-80,width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{maxWidth:540,width:'100%',position:'relative',zIndex:1}}>

        <div style={{textAlign:'center',marginBottom:22}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:12,background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:14,padding:'10px 18px',marginBottom:18,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
            <div style={{width:36,height:36,background:'linear-gradient(135deg,#0F766E,#14B8A6)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,color:'#fff',fontFamily:SANS}}>OZ</div>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#111827',fontFamily:SANS}}>קבוצת עוז הדר</div>
              <div style={{fontSize:11,color:'#9CA3AF',fontFamily:SANS}}>Oz Hadar Group</div>
            </div>
          </div>
          <h2 style={{fontFamily:DISPLAY,fontSize:'clamp(26px,5vw,36px)',fontWeight:800,color:'#0F172A',marginBottom:8}}>
            אנחנו כאן בשבילך
          </h2>
          <p style={{fontSize:15,color:'#6B7280',fontFamily:SANS}}>We are here for you — from day one</p>
        </div>

        <div style={{background:'#fff',border:'1.5px solid #F3F4F6',borderRadius:16,padding:'18px 20px',marginBottom:14,boxShadow:'0 2px 10px rgba(0,0,0,.04)',direction:'rtl'}}>
          <p style={{fontSize:14,color:'#374151',lineHeight:1.9,fontFamily:SANS}}>
            קבוצת עוז הדר עוסקת בגיוס ושיבוץ עובדים זרים בישראל כבר שנים רבות.
            כל עובד מגיע לקבל <strong style={{color:'#0F766E'}}>יחס מכבד, תנאים הוגנים, ומישהו שידאג לו</strong>.
          </p>
          <p style={{fontSize:13,color:'#9CA3AF',lineHeight:1.8,marginTop:10,direction:'ltr',textAlign:'left',fontFamily:SANS}}>
            Every worker deserves <strong style={{color:'#0F766E'}}>respect, fair conditions, and someone genuinely looking out for them</strong>.
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {cards.map((c,i) => (
            <div key={i} className="oz-card"
              style={{background:c.bg,border:`1.5px solid ${c.bc}`,borderRadius:14,padding:'14px',transition:'all .22s',boxShadow:'0 2px 6px rgba(0,0,0,.04)'}}>
              <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#1C1917',fontFamily:SANS}}>{c.he}</div>
              <div style={{fontSize:11,color:c.cl,fontWeight:600,marginBottom:7,fontFamily:SANS}}>{c.en}</div>
              <div style={{fontSize:12,color:'#6B7280',lineHeight:1.5,direction:'rtl',fontFamily:SANS}}>{c.dh}</div>
              <div style={{fontSize:11,color:'#9CA3AF',lineHeight:1.5,marginTop:3,fontFamily:SANS}}>{c.de}</div>
            </div>
          ))}
        </div>

        <button onClick={onContinue} className="oz-btn"
          style={{width:'100%',padding:'16px',background:'#0F766E',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:SANS,boxShadow:'0 4px 18px rgba(15,118,110,.22)',transition:'all .2s'}}>
          המשך למילוי הטופס ← Continue to Form
        </button>
      </div>
    </div>
  )
}
