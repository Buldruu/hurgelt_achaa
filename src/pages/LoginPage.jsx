import { useState, useRef } from 'react';
import {
  sendOTP, verifyOTP,
  loginWithEmail, registerWithEmail, resetPassword,
  upsertUserProfile,
} from '../firebase/auth';
import useStore from '../store/useStore';
import { Card, Btn, FormInput, Alert } from '../components/common/UI';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { setUser, setUserProfile } = useStore();

  // tab: 'phone' | 'email'
  const [authTab, setAuthTab]   = useState('email');
  // email sub-mode: 'login' | 'register' | 'reset'
  const [emailMode, setEmailMode] = useState('login');
  // role
  const [role, setRole]         = useState('customer');
  const [loading, setLoading]   = useState(false);

  // Phone state
  const [phone, setPhone]       = useState('');
  const [otpStep, setOtpStep]   = useState(false);
  const [code, setCode]         = useState(['','','','','','']);
  const refs = useRef([]);

  // Email state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ── PHONE ────────────────────────────────────────────────────────────────────

  async function handleSendOTP() {
    if (phone.length < 8) { toast.error('Утасны дугаараа оруулна уу'); return; }
    setLoading(true);
    try {
      const fmt = phone.startsWith('+') ? phone : `+976${phone.replace(/\s/g,'')}`;
      await sendOTP(fmt);
      setOtpStep(true);
      toast.success('OTP код илгээлээ 📱');
    } catch(e) { toast.error('OTP илгээхэд алдаа: ' + e.message); }
    setLoading(false);
  }

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) refs.current[i+1]?.focus();
  }

  async function handleVerifyOTP() {
    if (code.join('').length < 6) { toast.error('6 оронтой кодоо оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await verifyOTP(code.join(''));
      const p = await upsertUserProfile(u.uid, { phone: u.phoneNumber, role, name: '' });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch { toast.error('Код буруу байна'); }
    setLoading(false);
  }

  // ── EMAIL ────────────────────────────────────────────────────────────────────

  async function handleEmailLogin() {
    if (!email || !password) { toast.error('Имэйл болон нууц үгээ оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await loginWithEmail(email, password);
      const p = await upsertUserProfile(u.uid, { email: u.email, role, name: '' });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch(e) {
      const msg = e.code === 'auth/invalid-credential' ? 'Имэйл эсвэл нууц үг буруу байна'
                : e.code === 'auth/user-not-found'     ? 'Бүртгэлтэй хэрэглэгч олдсонгүй'
                : e.code === 'auth/wrong-password'     ? 'Нууц үг буруу байна'
                : e.message;
      toast.error(msg);
    }
    setLoading(false);
  }

  async function handleEmailRegister() {
    if (!name.trim())     { toast.error('Нэрээ оруулна уу'); return; }
    if (!email)           { toast.error('Имэйл оруулна уу'); return; }
    if (password.length < 6) { toast.error('Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return; }
    if (password !== confirmPw) { toast.error('Нууц үг таарахгүй байна'); return; }
    setLoading(true);
    try {
      const u = await registerWithEmail(email, password);
      const p = await upsertUserProfile(u.uid, { email: u.email, role, name: name.trim() });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Бүртгэл амжилттай үүслээ! 🎉');
    } catch(e) {
      const msg = e.code === 'auth/email-already-in-use' ? 'Энэ имэйл хаяг бүртгэлтэй байна'
                : e.code === 'auth/weak-password'        ? 'Нууц үг хэтэрхий энгийн байна'
                : e.code === 'auth/invalid-email'        ? 'Имэйл хаяг буруу байна'
                : e.message;
      toast.error(msg);
    }
    setLoading(false);
  }

  async function handleReset() {
    if (!email) { toast.error('Имэйл хаягаа оруулна уу'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Нууц үг сэргээх линк имэйлрүү илгээлээ 📧');
      setEmailMode('login');
    } catch {
      toast.error('Имэйл хаяг олдсонгүй');
    }
    setLoading(false);
  }

  // ── STYLES ───────────────────────────────────────────────────────────────────

  const tabBtn = (active) => ({
    flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700,
    border: 'none', background: active ? '#fff' : 'transparent',
    color: active ? '#1D9E75' : '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s',
  });

  const linkBtn = (onClick, label) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#1D9E75', fontSize: 13, fontWeight: 600,
      fontFamily: 'inherit', padding: 0,
    }}>{label}</button>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1D9E75 0%, #0F6E56 50%, #0A4D3E 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 10, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>🚛</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 4 }}>АчааЗам</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Монгол ачаа хүргэлтийн платформ</div>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <Card style={{ borderRadius: 20, padding: '24px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

          {/* Role selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, background: '#F0F2F5', borderRadius: 12 }}>
            {[{ key: 'customer', label: '👤 Захиалагч' }, { key: 'driver', label: '🚛 Жолооч' }].map(r => (
              <button key={r.key} onClick={() => setRole(r.key)} style={tabBtn(role === r.key)}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Auth method tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #F0F2F5' }}>
            {[
              { key: 'email', label: '📧 Имэйл' },
              { key: 'phone', label: '📱 Утас' },
            ].map(t => (
              <button key={t.key} onClick={() => { setAuthTab(t.key); setOtpStep(false); setEmailMode('login'); }} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none',
                borderBottom: authTab === t.key ? '2px solid #1D9E75' : '2px solid transparent',
                marginBottom: -2, fontWeight: 700, fontSize: 14,
                color: authTab === t.key ? '#1D9E75' : '#9CA3AF',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── EMAIL TAB ── */}
          {authTab === 'email' && (
            <>
              {emailMode === 'login' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Нэвтрэх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Имэйл хаягаараа нэвтрэнэ үү</div>

                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                  <FormInput label="Нууц үг" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} />

                  <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                    {linkBtn(() => setEmailMode('reset'), 'Нууц үг мартсан?')}
                  </div>

                  <Btn onClick={handleEmailLogin} disabled={loading}>
                    {loading ? '⏳ Нэвтэрч байна...' : '→ Нэвтрэх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    Бүртгэл байхгүй юу?{' '}
                    {linkBtn(() => setEmailMode('register'), 'Бүртгүүлэх')}
                  </div>
                </>
              )}

              {emailMode === 'register' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Бүртгүүлэх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Шинэ бүртгэл үүсгэнэ үү</div>

                  <FormInput label="Бүтэн нэр" type="text" placeholder="Овог Нэр"
                    value={name} onChange={e => setName(e.target.value)} />
                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                  <FormInput label="Нууц үг" type="password" placeholder="Хамгийн багадаа 6 тэмдэгт"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <FormInput label="Нууц үг давтах" type="password" placeholder="••••••••"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />

                  <Btn onClick={handleEmailRegister} disabled={loading}>
                    {loading ? '⏳ Бүртгэж байна...' : '✅ Бүртгүүлэх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    Бүртгэлтэй юу?{' '}
                    {linkBtn(() => setEmailMode('login'), 'Нэвтрэх')}
                  </div>
                </>
              )}

              {emailMode === 'reset' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Нууц үг сэргээх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                    Бүртгэлтэй имэйл хаягаа оруулна уу. Нууц үг сэргээх линк илгээнэ.
                  </div>

                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />

                  <Btn onClick={handleReset} disabled={loading}>
                    {loading ? '⏳ Илгээж байна...' : '📧 Линк илгээх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    {linkBtn(() => setEmailMode('login'), '← Нэвтрэх хуудас руу буцах')}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── PHONE TAB ── */}
          {authTab === 'phone' && (
            <>
              {!otpStep ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Утасаар нэвтрэх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Утасны дугаарт OTP код илгээнэ</div>

                  <FormInput label="Утасны дугаар" type="tel" placeholder="9911 0000"
                    value={phone} onChange={e => setPhone(e.target.value)} />

                  <div id="recaptcha-container" />
                  <Btn onClick={handleSendOTP} disabled={loading}>
                    {loading ? '⏳ Илгээж байна...' : '📱 OTP код авах'}
                  </Btn>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>OTP код оруулах</div>
                  <Alert variant="blue" style={{ marginBottom: 16 }}>
                    📲 <strong>{phone}</strong> руу 6 оронтой код илгээлээ
                  </Alert>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                    {code.map((c, i) => (
                      <input key={i} ref={el => refs.current[i] = el} value={c}
                        onChange={e => handleDigit(i, e.target.value)} maxLength={1}
                        style={{
                          width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 800,
                          border: '2px solid #E5E7EB', borderRadius: 12,
                          fontFamily: 'inherit', outline: 'none', background: '#FAFAFA',
                        }}
                        onFocus={e => e.target.style.borderColor = '#1D9E75'}
                        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                      />
                    ))}
                  </div>

                  <Btn onClick={handleVerifyOTP} disabled={loading}>
                    {loading ? '⏳ Баталгаажуулж байна...' : '✅ Баталгаажуулах'}
                  </Btn>

                  <button onClick={() => setOtpStep(false)} style={{
                    width: '100%', textAlign: 'center', marginTop: 12, fontSize: 13,
                    color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer',
                  }}>← Утасны дугаар солих</button>
                </>
              )}
            </>
          )}

        </Card>
      </div>
    </div>
  );
}