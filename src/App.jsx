// ─── REPLACE YOUR EXISTING App.jsx STATE + ROUTING WITH THIS ─────────────────
// In App.jsx, change the state and routing section as follows:

import { GateFlow } from './components/GateScreen.jsx'
import RegistrationForm from './components/RegistrationForm.jsx'

// Inside your App component:
const [screen, setScreen] = useState('gate')  // gate | form
const [lang, setLang]     = useState('he')

// Replace gate/about routing with:
// <GateFlow onYes={(selectedLang) => { setLang(selectedLang); setScreen('form') }} />

// Replace form rendering with:
// <RegistrationForm lang={lang} onDone={() => setScreen('gate')} />

// ─── MINIMAL COMPLETE App.jsx ─────────────────────────────────────────────────
import { useState } from 'react'
import { GateFlow } from './components/GateScreen.jsx'
import RegistrationForm from './components/RegistrationForm.jsx'
import CRM from './components/CRM.jsx'
import LoginScreen from './components/LoginScreen.jsx'

const CRM_PARAM = new URLSearchParams(window.location.search).has('crm')

export default function App() {
  const [screen, setScreen] = useState(CRM_PARAM ? 'crm' : 'gate')
  const [lang, setLang]     = useState('he')
  const [session, setSession] = useState(null)

  // CRM flow
  if (screen === 'crm') {
    if (!session) return <LoginScreen onLogin={s => setSession(s)} />
    return <CRM session={session} onLogout={() => setSession(null)} />
  }

  // Public registration flow
  if (screen === 'form') return <RegistrationForm lang={lang} onDone={() => setScreen('gate')} />
  return <GateFlow onYes={(l) => { setLang(l); setScreen('form') }} />
}
