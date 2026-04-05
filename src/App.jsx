import { useState, useEffect } from 'react'
import { onAuthChange, signOut } from './lib/supabase.js'
import GateScreen    from './components/GateScreen.jsx'
import AboutScreen   from './components/AboutScreen.jsx'
import RegistrationForm from './components/RegistrationForm.jsx'
import LoginScreen   from './components/LoginScreen.jsx'
import CRM           from './components/CRM.jsx'

// Detect if visitor is staff (?crm in URL or /crm path)
const isCRMRoute = () =>
  window.location.pathname.includes('crm') ||
  window.location.search.includes('crm')

export default function App() {
  const [session, setSession]   = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [screen, setScreen]     = useState('gate') // gate | about | form
  const [crmMode]               = useState(isCRMRoute)

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(s => {
      setSession(s)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── CRM path ──────────────────────────────────────────────────────────────
  if (crmMode) {
    if (authLoading) return <Spinner />
    if (!session)   return <LoginScreen onLogin={s => setSession(s)} />
    return (
      <Shell onSignOut={async () => { await signOut(); setSession(null) }}>
        <CRM session={session} />
      </Shell>
    )
  }

  // ── Public form path ─────────────────────────────────────────────────────
  return (
    <Shell>
      {screen === 'gate'  && <GateScreen  onYes={() => setScreen('about')} />}
      {screen === 'about' && <AboutScreen onContinue={() => setScreen('form')} />}
      {screen === 'form'  && <RegistrationForm onDone={() => setScreen('gate')} />}
    </Shell>
  )
}

function Shell({ children, onSignOut }) {
  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FF', fontFamily:"'Noto Sans Hebrew','Noto Sans',Arial,sans-serif" }}>
      <header style={{ background:'#1E1B4B', borderBottom:'3px solid #4F46E5', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:34, height:34, background:'#4F46E5', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:13 }}>OZ</div>
          <div>
            <div style={{ color:'white', fontWeight:800, fontSize:14 }}>קבוצת עוז הדר · Oz Hadar Group</div>
            <div style={{ color:'#A5B4FC', fontSize:11 }}>מערכת גיוס עובדים זרים · Foreign Worker Recruitment</div>
          </div>
        </div>
        {onSignOut && (
          <button onClick={onSignOut}
            style={{ padding:'7px 16px', background:'transparent', border:'1px solid #4F46E5', color:'#A5B4FC', borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
            התנתק / Sign Out
          </button>
        )}
      </header>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#9CA3AF', fontFamily:"'Noto Sans Hebrew',Arial,sans-serif" }}>
      טוען...
    </div>
  )
}
