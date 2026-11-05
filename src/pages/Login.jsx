// Login (wireframe A: seal above a single sign-in card) + password-reset request.
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Btn, FormField, Icon, Input } from '../components/ui.jsx';
import { getUser, login, requestPasswordReset, useStore } from '../store.js';
import { FEEDBACK_URL, ROLES } from '../schema.js';

const Brand = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
    <img src="./plm-seal.png" alt="Seal of Pamantasan ng Lungsod ng Maynila" style={{ width: 88, height: 88, objectFit: 'contain', marginBottom: 12 }} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5C6B7A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pamantasan ng Lungsod ng Maynila</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4, fontFamily: "'Source Serif 4', serif" }}>Research Management System</h1>
    </div>
  </div>
);
const Foot = () => (
  <p style={{ marginTop: 24, fontSize: 12, color: '#5C6B7A', textAlign: 'center', lineHeight: 1.6 }}>
    PLM Research Management System &nbsp;·&nbsp; AY 2025–2026<br />For assistance, contact the Research Office at research@plm.edu.ph<br />
    <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Prototype review? Leave suggestions or comments →</a>
  </p>
);

export function Login() {
  const state = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const demo = state.db.users.filter((u) => u.status === 'active');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(() => (sessionStorage.getItem('plm-idle') ? 'You were signed out after a period of inactivity. Please sign in again.' : ''));
  useEffect(() => { sessionStorage.removeItem('plm-idle'); }, []);

  if (getUser(state)) return <Navigate to={loc.state?.from || '/dashboard'} replace />;

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!email.trim()) er.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+$/.test(email.trim())) er.email = 'Enter a valid email address.';
    if (!password) er.password = 'Password is required.';
    setErrors(er); setFormError('');
    if (Object.keys(er).length) return;
    const res = login(email, password);
    if (!res.ok) setFormError(res.error);
    else nav(loc.state?.from || '/dashboard', { replace: true });
  };
  const pick = (u) => { setEmail(u.email); setPassword(u.password); setErrors({}); setFormError(''); };

  return (
    <div className="login-wrap">
      <Brand />
      <div className="login-card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Sign in to PLM-RMS</h2>
        <p style={{ fontSize: 14, color: '#5C6B7A', marginBottom: 20, lineHeight: 1.5 }}>Use your university credentials to access the system.</p>

        <div style={{ background: '#F6F0DA', border: '1px solid #C8A12A55', borderRadius: 6, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A6D12', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Demo — click a role to fill the form</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {demo.map((u) => (
              <button type="button" key={u.id} onClick={() => pick(u)} className="btn" style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 5, cursor: 'pointer', border: `1.5px solid ${email === u.email ? '#C8A12A' : 'transparent'}`, background: email === u.email ? '#fff' : 'transparent' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{ROLES[u.role].label}{u.college ? ` · ${state.db.colleges.find((c) => c.id === u.college)?.abbr}` : ''}</div>
                <div style={{ fontSize: 12, color: '#5C6B7A' }}>{u.email} &nbsp;/&nbsp; {u.password}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Email address" required error={errors.email}><Input value={email} onChange={setEmail} type="email" placeholder="yourname@plm.edu.ph" error={errors.email} autoComplete="username" /></FormField>
            <FormField label="Password" required error={errors.password}><Input value={password} onChange={setPassword} type="password" placeholder="Enter your password" error={errors.password} autoComplete="current-password" /></FormField>
            {formError && <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7E5E5', border: '1px solid #9B1B1B33', borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#9B1B1B' }}><Icon name="alert" size={14} color="#9B1B1B" />{formError}</div>}
            <Btn type="submit" size="lg" style={{ justifyContent: 'center', width: '100%' }}>Sign In</Btn>
            <Link to="/forgot-password" style={{ fontSize: 13, textAlign: 'center' }}>Forgot your password?</Link>
          </div>
        </form>
      </div>
      <Foot />
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Enter the email address of your account.'); return; }
    requestPasswordReset(email); // same message whether or not the account exists
    setErr(''); setSent(true);
  };
  return (
    <div className="login-wrap">
      <Brand />
      <div className="login-card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Reset your password</h2>
        {sent ? (
          <>
            <div role="status" style={{ background: '#E8F5EE', border: '1px solid #2E7D4F33', borderRadius: 6, padding: '12px 14px', margin: '16px 0', fontSize: 14, color: '#1F2933', lineHeight: 1.5 }}>
              If <strong>{email.trim()}</strong> belongs to an active account, the Research Office has been notified and will issue a temporary password.
            </div>
            <Btn to="/login" variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>Back to sign in</Btn>
          </>
        ) : (
          <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <p style={{ fontSize: 14, color: '#5C6B7A', lineHeight: 1.5 }}>Enter your university email. A Research Office administrator will reset your password.</p>
            <FormField label="Email address" required error={err}><Input value={email} onChange={setEmail} type="email" placeholder="yourname@plm.edu.ph" error={err} /></FormField>
            <Btn type="submit" size="lg" style={{ justifyContent: 'center' }}>Request reset</Btn>
            <Link to="/login" style={{ fontSize: 13, textAlign: 'center' }}>Back to sign in</Link>
          </form>
        )}
      </div>
      <Foot />
    </div>
  );
}
