// ─── GateScreen ──────────────────────────────────────────────────────────────

export function GateScreen({ onYes }) {
  return (
    <div style={{ minHeight:'calc(100vh - 62px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:500, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:58, marginBottom:18 }}>💼</div>
        <div style={{ fontSize:28, fontWeight:900, color:'#1E1B4B', lineHeight:1.3, marginBottom:8 }}>מחפש עבודה?</div>
        <div style={{ fontSize:16, color:'#6B7280', marginBottom:6 }}>Looking for a job?</div>
        <div style={{ fontSize:14, color:'#9CA3AF', marginBottom:6, lineHeight:1.7 }}>
          יש לנו עבודה — בנייה, תעשייה, מסחר וחקלאות.<br/>
          מלא את הטופס ונחזור אליך בהקדם.
        </div>
        <div style={{ fontSize:13, color:'#B0BAC9', marginBottom:24, lineHeight:1.7 }}>
          We have jobs available — construction, industry, commerce &amp; agriculture.<br/>
          Fill in the form and we will get back to you shortly.
        </div>

        <div style={{ background:'#F0F9FF', border:'1.5px solid #BAE6FD', borderRadius:12, padding:'14px 18px', marginBottom:32, textAlign:'right', direction:'rtl' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0369A1', marginBottom:5 }}>
            💡 אין לך ניסיון מקצועי? לא משנה — אנחנו פתוחים גם אליך
          </div>
          <div style={{ fontSize:12, color:'#0369A1', lineHeight:1.7 }}>
            אם אינך מוצא את התחום שלך ברשימה, או שאין לך ניסיון מקצועי קודם — אל תדאג.
            מלא את הפרטים האישיים ואת סטטוס הויזה, ודלג על החלק המקצועי.
          </div>
          <div style={{ borderTop:'1px solid #BAE6FD', marginTop:10, paddingTop:10, direction:'ltr', textAlign:'left' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0369A1', marginBottom:4 }}>
              💡 No professional experience? No problem — we welcome all applicants
            </div>
            <div style={{ fontSize:12, color:'#0369A1', lineHeight:1.7 }}>
              If you don't find your field in the list, or have no prior work experience,
              don't worry. Simply fill in your personal details and visa status, and skip the professional section.
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
          <button onClick={onYes}
            style={{ padding:'16px 44px', background:'#1D4ED8', color:'white', border:'none', borderRadius:14, fontSize:18, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 20px rgba(29,78,216,.35)', transition:'transform .1s', fontFamily:'inherit' }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            כן, אני מחפש עבודה ✅
          </button>
          <button style={{ padding:'16px 28px', background:'white', color:'#9CA3AF', border:'1.5px solid #E5E7EB', borderRadius:14, fontSize:16, fontWeight:700, cursor:'default', fontFamily:'inherit' }}>
            לא תודה
          </button>
        </div>
        <div style={{ fontSize:12, color:'#D1D5DB', marginTop:28 }}>Oz Hadar Group · מערכת גיוס עובדים זרים</div>
      </div>
    </div>
  )
}

// ─── AboutScreen ─────────────────────────────────────────────────────────────

export function AboutScreen({ onContinue }) {
  const cards_he = [
    ['⚖️','זכויות מלאות','נדאג לזכויות ההעסקה שלך לפי החוק הישראלי — שכר, ביטוח, חופשות ותנאי עבודה הוגנים.'],
    ['📋','ליווי בירוקרטי','נטפל בהיתרי העבודה, הוויזה, ובכל הניירת מול הרשויות — בלי שתצטרך להתמודד לבד.'],
    ['🏠','סיוע בדיור','נסייע לך למצוא מקום מגורים מתאים בסמוך למקום העבודה.'],
    ['📞','זמינות ותמיכה','יש לנו נציג שדובר את שפתך ויהיה זמין לכל שאלה ובכל עת.'],
  ]
  const cards_en = [
    ['⚖️','Your full rights','We ensure your employment rights under Israeli law — fair wages, insurance, leave, and proper working conditions.'],
    ['📋','Paperwork handled','We take care of your work permit, visa, and all official procedures — you won\'t face the bureaucracy alone.'],
    ['🏠','Housing support','We help you find suitable accommodation close to your workplace.'],
    ['📞','Always available','Our representatives speak your language and are available to answer any question, any time.'],
  ]

  const grid = (cards) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 }}>
      {cards.map(([icon, title, text]) => (
        <div key={title} style={{ background:'#F8F9FF', borderRadius:10, padding:'12px 14px', border:'1px solid #EEF2FF' }}>
          <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1E1B4B', marginBottom:4 }}>{title}</div>
          <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.6 }}>{text}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight:'calc(100vh - 62px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'#F8F9FF' }}>
      <div style={{ maxWidth:580, width:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, justifyContent:'center' }}>
          <div style={{ width:52, height:52, background:'#1D4ED8', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:18, boxShadow:'0 4px 16px rgba(29,78,216,.3)' }}>OZ</div>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#1E1B4B' }}>קבוצת עוז הדר</div>
            <div style={{ fontSize:13, color:'#9CA3AF' }}>Oz Hadar Group</div>
          </div>
        </div>

        <div style={{ background:'white', borderRadius:16, border:'1px solid #E5E7EB', boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden' }}>
          <div style={{ padding:'26px 28px 22px', direction:'rtl', borderBottom:'1px solid #F3F4F6' }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#1E1B4B', marginBottom:12 }}>אנחנו כאן בשבילך — מהיום הראשון ועד האחרון</div>
            <div style={{ fontSize:14, color:'#374151', lineHeight:1.9 }}>
              קבוצת עוז הדר עוסקת בגיוס ושיבוץ עובדים זרים בישראל כבר שנים רבות.
              אנחנו מאמינים שכל עובד שמגיע אלינו — מגיע לקבל יחס מכבד, תנאים הוגנים, ומישהו שידאג לו.
            </div>
            {grid(cards_he)}
          </div>

          <div style={{ padding:'22px 28px 26px', direction:'ltr' }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#1E1B4B', marginBottom:12 }}>We are here for you — from day one</div>
            <div style={{ fontSize:14, color:'#374151', lineHeight:1.9 }}>
              Oz Hadar Group has been placing foreign workers in Israel for many years.
              We believe every worker deserves respect, fair conditions, and someone genuinely looking out for them.
            </div>
            {grid(cards_en)}
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:24 }}>
          <button onClick={onContinue}
            style={{ padding:'15px 52px', background:'#1D4ED8', color:'white', border:'none', borderRadius:14, fontSize:16, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 20px rgba(29,78,216,.3)', transition:'transform .1s', fontFamily:'inherit' }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            המשך למילוי הטופס ← Continue to Form
          </button>
        </div>
      </div>
    </div>
  )
}

export default { GateScreen, AboutScreen }
