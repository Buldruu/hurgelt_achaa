import React, { useState, useRef } from 'react';
import { sendOTP, verifyOTP, upsertUserProfile } from '../firebase/auth';
import useStore from '../store/useStore';
import { Card, Btn, FormInput, Alert } from '../components/common/UI';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState(['','','','','','']);
  const [step, setStep]       = useState('phone');
  const [role, setRole]       = useState('customer');
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const { setUser, setUserProfile } = useStore();

  async function handleSend() {
    if (phone.length < 8) { toast.error('Утасны дугаараа оруулна уу'); return; }
    setLoading(true);
    try {
      const fmt = phone.startsWith('+') ? phone : `+976${phone.replace(/\s/g,'')}`;
      await sendOTP(fmt);
      setStep('otp');
      toast.success('OTP код илгээлээ 📱');
    } catch(e) { toast.error(e.message); }
    setLoading(false);
  }

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) refs.current[i+1]?.focus();
  }

  async function handleVerify() {
    if (code.join('').length < 6) { toast.error('6 оронтой кодоо оруулна уу'); return; }
    setLoading(true);
    try {
      const u = await verifyOTP(code.join(''));
      const p = await upsertUserProfile(u.uid, { phone: u.phoneNumber, role, name: '' });
      setUser(u);
      setUserProfile({ ...p, uid: u.uid });
      toast.success('Амжилттай нэвтэрлээ! 🎉');
    } catch(e) { toast.error('Код буруу байна'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1D9E75 0%,#0F6E56 50%,#0A4D3E 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:12, filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>🚛</div>
        <div style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-0.04em', marginBottom:4 }}>АчааЗам</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>Монгол ачаа хүргэлтийн платформ</div>
      </div>

      <div style={{ width:'100%', maxWidth:400 }}>
        <Card style={{ borderRadius:20, padding:'24px 20px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
          {/* Role selector */}
          <div style={{ display:'flex', gap:8, marginBottom:20, padding:4, background:'#F0F2F5', borderRadius:12 }}>
            {[{ key:'customer', label:'👤 Захиалагч' },{ key:'driver', label:'🚛 Жолооч' }].map(r => (
              <button key={r.key} onClick={() => setRole(r.key)} style={{
                flex:1, padding:'10px', borderRadius:10, fontSize:14, fontWeight:700,
                border:'none', background: role===r.key ? '#fff' : 'transparent',
                color: role===r.key ? '#1D9E75' : '#9CA3AF', cursor:'pointer', fontFamily:'inherit',
                boxShadow: role===r.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition:'all 0.2s',
              }}>{r.label}</button>
            ))}
          </div>

          {step === 'phone' ? (
            <>
              <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:4 }}>Нэвтрэх</div>
              <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>Утасны дугаараа оруулна уу</div>
              <FormInput type="tel" placeholder="9911 0000" value={phone} onChange={e=>setPhone(e.target.value)} label="Утасны дугаар" />
              <div id="recaptcha-container" />
              <Btn onClick={handleSend} disabled={loading}>
                {loading ? 'Илгээж байна...' : '📱 OTP код авах'}
              </Btn>
            </>
          ) : (
            <>
              <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:4 }}>Баталгаажуулах</div>
              <Alert variant="blue" style={{ marginBottom:16 }}>📲 {phone} руу 6 оронтой код илгээлээ</Alert>
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
                {code.map((c,i) => (
                  <input key={i} ref={el => refs.current[i]=el} value={c}
                    onChange={e => handleDigit(i, e.target.value)} maxLength={1}
                    style={{
                      width:46, height:54, textAlign:'center', fontSize:22, fontWeight:800,
                      border:'2px solid #E5E7EB', borderRadius:12, fontFamily:'inherit', outline:'none',
                      background:'#FAFAFA', transition:'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor='#1D9E75'}
                    onBlur={e => e.target.style.borderColor='#E5E7EB'}
                  />
                ))}
              </div>
              <Btn onClick={handleVerify} disabled={loading}>
                {loading ? 'Баталгаажуулж байна...' : '✅ Баталгаажуулах'}
              </Btn>
              <button onClick={()=>setStep('phone')} style={{
                width:'100%', textAlign:'center', marginTop:12, fontSize:13,
                color:'#9CA3AF', background:'none', border:'none', cursor:'pointer',
              }}>← Утасны дугаар солих</button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
