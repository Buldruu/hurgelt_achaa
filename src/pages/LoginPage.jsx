import { useState, useRef } from 'react';
import {
  sendOTP, verifyOTP,
  loginWithEmail, registerWithEmail, resetPassword,
  upsertUserProfile,
} from '../firebase/auth';
import useStore from '../store/useStore';
import { Card, Btn, FormInput, Alert } from '../components/common/UI';
import toast from 'react-hot-toast';

// ─── Нэг хэрэглэгчийн нэвтрэх / бүртгэх форм ───────────────────────────────
function AuthForm({ role, onSuccess }) {
  const [authTab, setAuthTab] = useState('email');
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);

  // Phone OTP
  const [phone, setPhone]     = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode]       = useState(['','','','','','']);
  const refs = useRef([]);

  // Талбарууд
  const [lastName, setLastName]   = useState('');
  const [firstName, setFirstName] = useState('');
  const [regPhone, setRegPhone]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const isRegister = mode === 'register';
  const isDriver   = role === 'driver';
  const accent     = isDriver ? '#185FA5' : '#1D9E75';

  // ── Phone OTP ──────────────────────────────────────────────────────────────
  async function handleSendOTP() {
    if (isRegister && (!lastName.trim() || !firstName.trim())) { toast.error('Овог нэрээ оруулна уу'); return; }
    if (phone.length < 8) { toast.error('Утасны дугаараа оруулна уу'); return; }
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
      const p = await upsertUserProfile(u.uid, {
        phone: u.phoneNumber,
        ...(isRegister && { role, name: fullName, lastName: lastName.trim(), firstName: firstName.trim() }),
      });
      onSuccess(u, p);
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch { toast.error('Код буруу байна'); }
    setLoading(false);
  }

  // ── Email Login ────────────────────────────────────────────────────────────
  async function handleEmailLogin() {
    if (!email || !password) { toast.error('Имэйл болон нууц үгээ оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await loginWithEmail(email, password);
      // role дамжуулна — Firestore-д role байхгүй хуучин бүртгэлд нэг удаа тохируулна
      // Байгаа role байвал upsertUserProfile хэзээ ч дарахгүй
      const p = await upsertUserProfile(u.uid, { email: u.email, role });
      onSuccess(u, p);
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

  // ── Email Register ─────────────────────────────────────────────────────────
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
        email: u.email, role,
        name: fullName, lastName: lastName.trim(), firstName: firstName.trim(),
        phone: regPhone.trim(),
      });
      onSuccess(u, p);
      toast.success('Бүртгэл амжилттай үүслээ! 🎉');
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        // Бүртгэлтэй email — нэвтрэх хуудас руу шилжүүлнэ
        toast.error('Энэ имэйл хаяг бүртгэлтэй байна. Нэвтрэх хуудас руу шилжлээ.');
        setMode('login');
        setPassword('');
        setConfirmPw('');
      } else {
        const msg = e.code === 'auth/weak-password'  ? 'Нууц үг хэтэрхий энгийн байна'
                  : e.code === 'auth/invalid-email'  ? 'Имэйл хаяг буруу байна'
                  : e.message;
        toast.error(msg);
      }
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

  const link = (onClick, label) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: accent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0,
    }}>{label}</button>
  );

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', background: 'none', border: 'none',
    borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
    marginBottom: -2, fontWeight: 700, fontSize: 14,
    color: active ? accent : '#9CA3AF',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  });

  return (
    <Card style={{ borderRadius: 20, padding: '22px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

      {/* Auth method tabs */}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 2 }}>Нэвтрэх</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                {isDriver ? '🚛 Жолоочийн' : '👤 Захиалагчийн'} бүртгэлээр нэвтрэнэ үү
              </div>
              <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                value={email} onChange={e => setEmail(e.target.value)} />
              <FormInput label="Нууц үг" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
              <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                {link(() => setMode('reset'), 'Нууц үг мартсан?')}
              </div>
              <Btn onClick={handleEmailLogin} disabled={loading} style={{ background: accent }}>
                {loading ? '⏳ Нэвтэрч байна...' : '→ Нэвтрэх'}
              </Btn>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                Бүртгэл байхгүй юу?{' '}{link(() => setMode('register'), 'Бүртгүүлэх')}
              </div>
            </>
          )}

          {/* ── Бүртгүүлэх ── */}
          {mode === 'register' && (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 2 }}>Бүртгүүлэх</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                {isDriver ? '🚛 Жолоочийн' : '👤 Захиалагчийн'} шинэ бүртгэл үүсгэнэ
              </div>

              {/* Нэг email-ийг хоёр role-д ашиглах боломжгүй гэдгийг сануулна */}
              <div style={{ background: '#FFF9E6', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                ⚠️ Нэг имэйл хаягаар зөвхөн <strong>нэг бүртгэл</strong> үүсгэх боломжтой.
                {isDriver
                  ? ' Захиалагчийн бүртгэлтэй имэйлээр жолоочид бүртгүүлэх боломжгүй.'
                  : ' Жолоочийн бүртгэлтэй имэйлээр захиалагчид бүртгүүлэх боломжгүй.'
                }
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <FormInput label="Овог" placeholder="Батбаяр" value={lastName} onChange={e => setLastName(e.target.value)} />
                <FormInput label="Нэр" placeholder="Тэмүүжин" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <FormInput label="Утасны дугаар" type="tel" placeholder="9911 0000"
                value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                value={email} onChange={e => setEmail(e.target.value)} />
              <FormInput label="Нууц үг" type="password" placeholder="Хамгийн багадаа 6 тэмдэгт"
                value={password} onChange={e => setPassword(e.target.value)} />
              <FormInput label="Нууц үг давтах" type="password" placeholder="••••••••"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              <Btn onClick={handleEmailRegister} disabled={loading} style={{ background: accent }}>
                {loading ? '⏳ Бүртгэж байна...' : '✅ Бүртгүүлэх'}
              </Btn>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                Бүртгэлтэй юу?{' '}{link(() => setMode('login'), 'Нэвтрэх')}
              </div>
            </>
          )}

          {/* ── Нууц үг сэргээх ── */}
          {mode === 'reset' && (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 4 }}>Нууц үг сэргээх</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Бүртгэлтэй имэйл хаягаа оруулна уу.
              </div>
              <FormInput label="Имэйл хаяг" type="email" placeholder="example@gmail.com"
                value={email} onChange={e => setEmail(e.target.value)} />
              <Btn onClick={handleReset} disabled={loading} style={{ background: accent }}>
                {loading ? '⏳ Илгээж байна...' : '📧 Линк илгээх'}
              </Btn>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                {link(() => setMode('login'), '← Буцах')}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 2 }}>
                {isRegister ? 'Бүртгүүлэх' : 'Утасаар нэвтрэх'}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                {isRegister ? 'Мэдээллээ бөглөөд OTP авна уу' : 'Утасны дугаарт OTP код илгээнэ'}
              </div>

              {isRegister && (
                <>
                  <div style={{ background: '#FFF9E6', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                    ⚠️ Нэг утасны дугаараар зөвхөн <strong>нэг бүртгэл</strong> үүсгэх боломжтой.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <FormInput label="Овог" placeholder="Батбаяр" value={lastName} onChange={e => setLastName(e.target.value)} />
                    <FormInput label="Нэр" placeholder="Тэмүүжин" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                </>
              )}

              <FormInput label="Утасны дугаар" type="tel" placeholder="9911 0000"
                value={phone} onChange={e => setPhone(e.target.value)} />
              <div id="recaptcha-container" />
              <Btn onClick={handleSendOTP} disabled={loading} style={{ background: accent }}>
                {loading ? '⏳ Илгээж байна...' : '📱 OTP код авах'}
              </Btn>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                {isRegister
                  ? <>{link(() => setMode('login'), '← Нэвтрэх')}</>
                  : <>Бүртгэл байхгүй юу?{' '}{link(() => setMode('register'), 'Бүртгүүлэх')}</>
                }
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 8 }}>OTP код оруулах</div>
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
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                ))}
              </div>
              <Btn onClick={handleVerifyOTP} disabled={loading} style={{ background: accent }}>
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
  );
}

// ─── Үндсэн LoginPage ────────────────────────────────────────────────────────
export default function LoginPage() {
  const { setUser, setUserProfile } = useStore();
  const [activeRole, setActiveRole] = useState('customer');

  function onSuccess(firebaseUser, profile) {
    setUser(firebaseUser);
    setUserProfile({ ...profile, uid: firebaseUser.uid });
  }

  const isDriver = activeRole === 'driver';
  const bg = isDriver
    ? 'linear-gradient(160deg, #185FA5 0%, #0A3060 100%)'
    : 'linear-gradient(160deg, #1D9E75 0%, #0A4D3E 100%)';

  return (
    <div style={{
      minHeight: '100vh', background: bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, transition: 'background 0.4s',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 8, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>🚛</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 4 }}>АчааЗам</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Монгол ачаа хүргэлтийн платформ</div>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Хэрэглэгчийн төрөл */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { key: 'customer', icon: '👤', label: 'Захиалагч', sub: 'Ачаа илгээх' },
            { key: 'driver',   icon: '🚛', label: 'Жолооч',    sub: 'Ачаа хүргэх' },
          ].map(r => {
            const active = activeRole === r.key;
            const activeColor = r.key === 'driver' ? '#185FA5' : '#1D9E75';
            return (
              <button key={r.key} onClick={() => setActiveRole(r.key)} style={{
                flex: 1, padding: '14px 10px', borderRadius: 16, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'center', border: 'none',
                background: active ? '#fff' : 'rgba(255,255,255,0.15)',
                boxShadow: active ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: active ? activeColor : 'rgba(255,255,255,0.9)' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, color: active ? '#9CA3AF' : 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {r.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* key prop: role солиход форм бүрэн reset болно */}
        <AuthForm key={activeRole} role={activeRole} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
