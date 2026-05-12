// src/pages/LoginPage.jsx
import React, { useState, useRef } from 'react';
import { sendOTP, verifyOTP, upsertUserProfile } from '../firebase/auth';
import useStore from '../store/useStore';
import { Card, Btn, FormInput, Alert } from '../components/common/UI';
import toast from 'react-hot-toast';

export default function LoginPage({ defaultRole = 'customer' }) {
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [step, setStep]         = useState('phone'); // 'phone' | 'otp'
  const [role, setRole]         = useState(defaultRole);
  const [loading, setLoading]   = useState(false);
  const inputRefs               = useRef([]);
  const { setUser, setUserProfile } = useStore();

  async function handleSendOTP() {
    if (!phone || phone.length < 8) { toast.error('Утасны дугаараа оруулна уу'); return; }
    setLoading(true);
    try {
      const formatted = phone.startsWith('+') ? phone : `+976${phone.replace(/\s/g, '')}`;
      await sendOTP(formatted);
      setStep('otp');
      toast.success('OTP код илгээлээ');
    } catch (e) {
      toast.error('OTP илгээхэд алдаа: ' + e.message);
    }
    setLoading(false);
  }

  function handleCodeChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length < 6) { toast.error('6 оронтой кодоо оруулна уу'); return; }
    setLoading(true);
    try {
      const firebaseUser = await verifyOTP(fullCode);
      const profile = await upsertUserProfile(firebaseUser.uid, {
        phone: firebaseUser.phoneNumber,
        role,
        name: '',
      });
      setUser(firebaseUser);
      setUserProfile({ ...profile, uid: firebaseUser.uid });
      toast.success('Амжилттай нэвтэрлээ!');
    } catch (e) {
      toast.error('Код буруу байна: ' + e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🚛</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1D9E75' }}>АчааЗам</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Монгол ачаа хүргэлтийн платформ
        </div>
      </div>

      <Card>
        {/* Role selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'customer', label: '👤 Захиалагч' },
            { key: 'driver',   label: '🚛 Жолооч' },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: role === r.key ? 'none' : '1px solid rgba(0,0,0,0.12)',
                background: role === r.key ? '#1D9E75' : '#fff',
                color: role === r.key ? '#fff' : '#374151',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {step === 'phone' ? (
          <>
            <FormInput
              label="Утасны дугаар"
              type="tel"
              placeholder="9911 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div id="recaptcha-container" />
            <Btn onClick={handleSendOTP} disabled={loading}>
              {loading ? 'Илгээж байна...' : '📱 OTP код авах'}
            </Btn>
          </>
        ) : (
          <>
            <Alert variant="blue">
              📲 {phone} дугаарт 6 оронтой код илгээлээ
            </Alert>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  value={c}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  maxLength={1}
                  style={{
                    width: 46, height: 52, textAlign: 'center',
                    fontSize: 22, fontWeight: 800,
                    border: '2px solid rgba(0,0,0,0.12)', borderRadius: 10,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              ))}
            </div>
            <Btn onClick={handleVerify} disabled={loading}>
              {loading ? 'Баталгаажуулж байна...' : '✅ Баталгаажуулах'}
            </Btn>
            <button
              onClick={() => setStep('phone')}
              style={{ width: '100%', textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Утасны дугаар солих
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
