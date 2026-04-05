import { useState } from 'react'
import { signIn } from '../lib/supabase.js'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    setLoading(true)
    try {
      const data = await signIn(email, password)
      onLogin(data.session)
    } catch (e) {
      setError('אימייל או סיסמה שגויים / Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const F = { fontFamily:"'Noto Sans Hebrew','Noto Sans',Arial,sans-serif" }

  return (
    <div style={{ ...F, minHeight:'100vh', background:'#F8F9FF', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:16, border:'1px solid #E5E7EB', boxShadow:'0 4px 24px rgba(0,0,0,.08)', padding:'40px 36px', width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'#1D4ED8', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:20, margin:'0 auto 16px' }}>OZ</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1E1B4B' }}>כניסה למערכת CRM</div>
          <div style={{ fontSize:13, color:'#9CA3AF', marginTop:4 }}>Staff Login — Oz Hadar Group</div>
        </div>

        {['אימייל / Email', 'סיסמה / Password'].map((label, i) => (
          <div key={i} style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{label}</label>
            <input
              type={i === 1 ? 'password' : 'email'}
              value={i === 0 ? email : password}
              onChange={e => i === 0 ? setEmail(e.target.value) : setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:14, outline:'none', fontFamily:'inherit' }}
            />
          </div>
        ))}

        {error && <div style={{ fontSize:13, color:'#DC2626', marginBottom:14, textAlign:'center' }}>{error}</div>}

        <button onClick={submit} disabled={loading}
          style={{ width:'100%', padding:13, background: loading ? '#818CF8' : '#1D4ED8', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', marginTop:4 }}>
          {loading ? 'מתחבר...' : 'כניסה / Login'}
        </button>

        <div style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', marginTop:20, lineHeight:1.6 }}>
          לקבלת גישה, פנה למנהל המערכת<br/>
          Contact your system administrator for access
        </div>
      </div>
    </div>
  )
}
