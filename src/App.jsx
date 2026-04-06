import { useState, useEffect } from 'react'
import { GateFlow } from './features/gate/GateScreen.jsx'
import RegistrationForm from './features/registration/RegistrationForm.jsx'
import CRM from './features/crm/CRM.jsx'
import LoginScreen from './features/crm/LoginScreen.jsx'
import { getSession, onAuthChange } from './lib/supabase.js'

const IS_CRM = new URLSearchParams(window.location.search).has('crm')

export default function App() {
  const [screen, setScreen]   = useState(IS_CRM ? 'crm' : 'gate')
  const [lang, setLang]       = useState('he')
  const [session, setSession] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(IS_CRM)

  useEffect(() => {
    if (!IS_CRM) return
    getSession().then(s => {
      setSession(s)
      setLoadingAuth(false)
    })
    const { data: { subscription } } = onAuthChange(s => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (IS_CRM) {
    if (loadingAuth) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Outfit',sans-serif", color:'#9CA3AF', fontSize:14 }}>
        טוען...
      </div>
    )
    if (!session) return <LoginScreen onLogin={s => setSession(s)} />
    return <CRM session={session} onLogout={async () => { const { signOut } = await import('./lib/supabase.js'); await signOut(); setSession(null) }} />
  }

  if (screen === 'form') {
    return (
      <RegistrationForm
        lang={lang}
        onDone={() => setScreen('gate')}
      />
    )
  }

  return (
    <GateFlow
      onYes={(selectedLang) => {
        setLang(selectedLang)
        setScreen('form')
      }}
    />
  )
}