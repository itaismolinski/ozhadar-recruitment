import { useState } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { GateFlow } from './features/gate/GateScreen.jsx';
import RegistrationForm from './features/registration/RegistrationForm.jsx';
import CRM from './features/crm/CRM.jsx';
import LoginScreen from './features/crm/LoginScreen.jsx';

const IS_CRM = new URLSearchParams(window.location.search).has('crm');

function AppContent() {
  const { session, loading, signOut } = useAuth();
  
  const [screen, setScreen] = useState('gate');
  const [lang, setLang] = useState('he');

  // ── CRM (Staff Portal) ───────────────────────────────────────────────────
  if (IS_CRM) {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: "'Outfit', sans-serif",
          color: '#9CA3AF',
          fontSize: '14px'
        }}>
          טוען...
        </div>
      );
    }

    if (!session) {
      return <LoginScreen />;
    }

    return <CRM session={session} onLogout={signOut} />;
  }

  // ── Public Registration Flow ─────────────────────────────────────────────
  if (screen === 'form') {
    return (
      <RegistrationForm
        lang={lang}
        onDone={() => setScreen('gate')}
      />
    );
  }

  return (
    <GateFlow
      onYes={(selectedLang) => {
        setLang(selectedLang);
        setScreen('form');
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider isCRM={IS_CRM}>
      <AppContent />
    </AuthProvider>
  );
}
