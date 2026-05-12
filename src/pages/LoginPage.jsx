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

  const [authTab, setAuthTab]     = useState('email');
  // 'login' | 'register' | 'reset'
  const [mode, setMode]           = useState('login');
  // register дээр сонгосон role
  const [role, setRole]           = useState('customer');
  const [loading, setLoading]     = useState(false);

  // Phone OTP
  const [phone, setPhone]     = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode]       = useState(['','','','','','']);
  const refs = useRef([]);

  // Бүртгэлийн талбарууд
  const [lastName, setLastName]   = useState('');
  const [firstName, setFirstName] = useState('');
  const [regPhone, setRegPhone]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Нэвтрэх үед role selector харагдах эсэх
  const isRegister = mode === 'register';
  const accentColor = isRegister
    ? (role === 'driver' ? '#185FA5' : '#1D9E75')
    : '#1D9E75';

  // ── PHONE OTP ──────────────────────────────────────────────────────────────

  async function handleSendOTP() {
    if (phone.length < 8) { toast.error('Утасны дугаараа оруулна уу'); return; }
    if (isRegister && (!lastName.trim() || !firstName.trim())) {
      toast.error('Овог нэрээ оруулна уу'); return;
    }
    setLoading(true);
    try {
      const fmt = phone.startsWith('+') ? phone : '+976' + phone.replace(/\s/g, '');
      await sendOTP(fmt);
      setOtpStep(true);
      toast.success('OTP код илгээлээ 📱');
    } catch (e) { toast.error('OTP илгээхэд алдаа: ' + e.message); }
    setLoading(false);
  }

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  async function handleVerifyOTP() {
    if (code.join('').length < 6) { toast.error('6 оронтой кодоо оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await verifyOTP(code.join(''));
      const fullName = lastName.trim() + ' ' + firstName.trim();
      // Шинэ хэрэглэгч бол role тавина, байгаа бол хэвээр үлдэнэ
      const p = await upsertUserProfile(u.uid, {
        phone: u.phoneNumber,
        ...(isRegister && {
          role,
          name: fullName,
          lastName: lastName.trim(),
          firstName: firstName.trim(),
        }),
      });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch { toast.error('Код буруу байна'); }
    setLoading(false);
  }

  // ── EMAIL ──────────────────────────────────────────────────────────────────

  async function handleEmailLogin() {
    if (!email || !password) { toast.error('Имэйл болон нууц үгээ оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await loginWithEmail(email, password);
      // Login: role дамжуулахгүй — Firestore-д байгаа role-г уншина
      const p = await upsertUserProfile(u.uid, { email: u.email });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch (e) {
      const msg = e.code === 'auth/invalid-credential' ? 'Имэйл эсвэл нууц үг буруу байна'
                : e.code === 'auth/user-not-found'     ? 'Бүртгэлтэй хэрэглэгч олдсонгүй'
                : e.code === 'auth/wrong-password'     ? 'Нууц үг буруу байна'
                : e.message;
      toast.error(msg);
    }
    setLoading(false);
  }

  async function handleEmailRegister() {
    if (!lastName.trim())       { toast.error('Овгоо оруулна уу'); return; }
    if (!firstName.trim())      { toast.error('Нэрээ оруулна уу'); return; }
    if (!regPhone.trim())       { toast.error('Утасны дугаараа оруулна уу'); return; }
    if (!email)                 { toast.error('Имэйл оруулна уу'); return; }
    if (password.length < 6)    { toast.error('Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return; }
    if (password !== confirmPw) { toast.error('Нууц үг таарахгүй байна'); return; }
    setLoading(true);
    try {
      const u = await registerWithEmail(email, password);
      const fullName = lastName.trim() + ' ' + firstName.trim();
      const p = await upsertUserProfile(u.uid, {
        email: u.email,
        role,
        name: fullName,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        phone: regPhone.trim(),
      });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Бүртгэл амжилттай үүслээ! 🎉');
    } catch (e) {
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
      setMode('login');
    } catch { toast.error('Имэйл хаяг олдсонгүй'); }
    setLoading(false);
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  const linkBtn = (onClick, label) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: accentColor, fontSize: 13, fontWeight: 600,
      fontFamily: 'inherit', padding: 0,
    }}>{label}</button>
  );

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', background: 'none', border: 'none',
    borderBottom: active ? '2px solid ' + accentColor : '2px solid transparent',
    marginBottom: -2, fontWeight: 700, fontSize: 14,
    color: active ? accentColor : '#9CA3AF',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  });

  const bgColor = isRegister && role === 'driver'
    ? 'linear-gradient(160deg, #185FA5 0%, #0A3060 100%)'
    : 'linear-gradient(160deg, #1D9E75 0%, #0A4D3E 100%)';

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, transition: 'background 0.4s',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 10, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>🚛</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 4 }}>АчааЗам</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Монгол ачаа хүргэлтийн платформ</div>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <Card style={{ borderRadius: 20, padding: '24px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

          {/* ── Role selector: зөвхөн бүртгүүлэх үед харагдана ── */}
          {isRegister && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
                Та ямар хэрэглэгч бол?
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 4, background: '#F0F2F5', borderRadius: 12 }}>
                {[
                  { key: 'customer', icon: '👤', label: 'Захиалагч', sub: 'Ачаа илгээх' },
                  { key: 'driver',   icon: '🚛', label: 'Жолооч',    sub: 'Ачаа хүргэх' },
                ].map(r => (
                  <button key={r.key} onClick={() => setRole(r.key)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                    background: role === r.key ? '#fff' : 'transparent',
                    boxShadow: role === r.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 3 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: role === r.key ? accentColor : '#6B7280' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Auth method tabs ── */}
          <div style={{ display: 'flex', marginBottom: 20, borderBottom: '2px solid #F0F2F5' }}>
            {[{ key: 'email', label: '📧 Имэйл' }, { key: 'phone', label: '📱 Утас' }].map(t => (
              <button key={t.key}
                onClick={() => { setAuthTab(t.key); setOtpStep(false); setMode('login'); }}
                style={tabStyle(authTab === t.key)}
              >{t.label}</button>
            ))}
          </div>

          {/* ════ EMAIL TAB ════ */}
          {authTab === 'email' && (
            <>
              {/* ── Нэвтрэх ── */}
              {mode === 'login' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Нэвтрэх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Имэйл хаягаараа нэвтрэнэ үү</div>

                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                  <FormInput label="Нууц үг" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} />

                  <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                    {linkBtn(() => setMode('reset'), 'Нууц үг мартсан?')}
                  </div>

                  <Btn onClick={handleEmailLogin} disabled={loading} style={{ background: accentColor }}>
                    {loading ? '⏳ Нэвтэрч байна...' : '→ Нэвтрэх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    Бүртгэл байхгүй юу?{' '}
                    {linkBtn(() => setMode('register'), 'Бүртгүүлэх')}
                  </div>
                </>
              )}

              {/* ── Бүртгүүлэх ── */}
              {mode === 'register' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Бүртгүүлэх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                    {role === 'driver' ? '🚛 Жолоочийн' : '👤 Захиалагчийн'} шинэ бүртгэл
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FormInput label="Овог" type="text" placeholder="Батбаяр"
                      value={lastName} onChange={e => setLastName(e.target.value)} />
                    <FormInput label="Нэр" type="text" placeholder="Тэмүүжин"
                      value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <FormInput label="Утасны дугаар" type="tel" placeholder="9911 0000"
                    value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                  <FormInput label="Нууц үг" type="password" placeholder="Хамгийн багадаа 6 тэмдэгт"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <FormInput label="Нууц үг давтах" type="password" placeholder="••••••••"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />

                  <Btn onClick={handleEmailRegister} disabled={loading} style={{ background: accentColor }}>
                    {loading ? '⏳ Бүртгэж байна...' : '✅ Бүртгүүлэх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    Бүртгэлтэй юу?{' '}
                    {linkBtn(() => setMode('login'), 'Нэвтрэх')}
                  </div>
                </>
              )}

              {/* ── Нууц үг сэргээх ── */}
              {mode === 'reset' && (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Нууц үг сэргээх</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                    Бүртгэлтэй имэйл хаягаа оруулна уу.
                  </div>

                  <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} />

                  <Btn onClick={handleReset} disabled={loading} style={{ background: accentColor }}>
                    {loading ? '⏳ Илгээж байна...' : '📧 Линк илгээх'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    {linkBtn(() => setMode('login'), '← Буцах')}
                  </div>
                </>
              )}
            </>
          )}

          {/* ════ PHONE TAB ════ */}
          {authTab === 'phone' && (
            <>
              {!otpStep ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                    {isRegister ? 'Бүртгүүлэх' : 'Утасаар нэвтрэх'}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                    {isRegister ? 'Мэдээллээ бөглөөд OTP авна уу' : 'Утасны дугаарт OTP код илгээнэ'}
                  </div>

                  {/* Бүртгүүлэх үед нэр асуух */}
                  {isRegister && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <FormInput label="Овог" type="text" placeholder="Батбаяр"
                        value={lastName} onChange={e => setLastName(e.target.value)} />
                      <FormInput label="Нэр" type="text" placeholder="Тэмүүжин"
                        value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                  )}

                  <FormInput label="Утасны дугаар" type="tel" placeholder="9911 0000"
                    value={phone} onChange={e => setPhone(e.target.value)} />

                  <div id="recaptcha-container" />

                  <Btn onClick={handleSendOTP} disabled={loading} style={{ background: accentColor }}>
                    {loading ? '⏳ Илгээж байна...' : '📱 OTP код авах'}
                  </Btn>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                    {isRegister
                      ? <>{' '}Бүртгэлтэй юу?{' '}{linkBtn(() => setMode('login'), 'Нэвтрэх')}</>
                      : <>Бүртгэл байхгүй юу?{' '}{linkBtn(() => setMode('register'), 'Бүртгүүлэх')}</>
                    }
                  </div>
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
                        onFocus={e => e.target.style.borderColor = accentColor}
                        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                      />
                    ))}
                  </div>

                  <Btn onClick={handleVerifyOTP} disabled={loading} style={{ background: accentColor }}>
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
