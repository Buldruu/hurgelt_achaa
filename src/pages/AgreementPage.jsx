import { useRef, useState } from 'react';
import { Card, Btn, CheckRow } from '../components/common/UI';
import { saveAgreement } from '../firebase/db';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const TERMS = `1. ПЛАТФОРМЫН ҮҮРЭГ
АчааЗам платформ нь зөвхөн захиалагч болон жолоочийг холбох зуучлагч үүрэг гүйцэтгэнэ. Платформ нь тээвэрлэлтийг өөрөө гүйцэтгэхгүй.

2. ХЭРЭГЛЭГЧИЙН ХАРИУЦЛАГА
Захиалагч болон жолооч нь гүйлгээнд оролцож буй барааг хуульд нийцсэн эсэхийг бие даан баталгаажуулах үүрэгтэй. Хуулийн зөрчил гарсан тохиолдолд платформ ямар нэгэн хариуцлага хүлээхгүй.

3. ХОРИОТОЙ БАРАА
Мансууруулах бодис, зэвсэг, дэлбэрэх зүйл, хулгайлсан бараа, хуурамч баримт бичиг болон Монгол улсын хуулиар хориглосон аливаа барааг тээвэрлэхийг хатуу хориглоно.

4. ПЛАТФОРМЫН ЭРХ
Платформ нь сэжигтэй хэрэглэгчийг блоклох, хуулийн байгууллагад мэдэгдэх эрхтэй. Гэрээний огноо, цаг, хэрэглэгчийн мэдээлэл хадгалагдана.

5. ТӨЛБӨРИЙН НӨХЦӨЛ
Захиалагч захиалга баталгаажуулахад төлбөр хийнэ. Хүргэлт дуусч нотлох зураг байршуулсны дараа жолоочид шилжүүлнэ.`;

export default function AgreementPage({ role = 'customer', onAccepted }) {
  const { user } = useStore();
  const [checked, setChecked] = useState(false);
  const [sigName, setSigName] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  function getXY(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return [src.clientX - r.left, src.clientY - r.top];
  }
  function startDraw(e) {
    e.preventDefault(); drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const [x,y] = getXY(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(x,y);
  }
  function draw(e) {
    e.preventDefault(); if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#1D9E75'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const [x,y] = getXY(e, canvasRef.current);
    ctx.lineTo(x,y); ctx.stroke();
  }
  function stopDraw() { drawing.current = false; }
  function clearCanvas() { const c = canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); }

  async function handleAccept() {
    if (!checked || !sigName.trim()) { toast.error('Нэрээ бичиж, нөхцөлийг зөвшөөрнө үү'); return; }
    setLoading(true);
    try {
      await saveAgreement(user?.uid || 'anon', role, { userAgent: navigator.userAgent, signedName: sigName });
      toast.success('Гэрээ амжилттай зөвшөөрөгдлөө ✅');
      onAccepted?.();
    } catch(e) { toast.error(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ padding:'14px 14px 80px' }}>
      <Card>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px', boxShadow:'0 8px 20px rgba(29,158,117,0.35)' }}>📋</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#111827', marginBottom:4 }}>Үйлчилгээний нөхцөл</div>
          <div style={{ fontSize:13, color:'#6B7280' }}>Үргэлжлүүлэхийн тулд гэрээ зөвшөөрөх шаардлагатай</div>
        </div>

        <div style={{
          maxHeight:200, overflowY:'auto', border:'1px solid #F0F0F0', borderRadius:12,
          padding:'12px 14px', fontSize:13, color:'#6B7280', lineHeight:1.8,
          marginBottom:16, background:'#FAFAFA', whiteSpace:'pre-line',
        }}>{TERMS}</div>

        <CheckRow id="agree" checked={checked} onChange={e => setChecked(e.target.checked)}>
          Би дээрх үйлчилгээний нөхцлийг бүрэн уншиж ойлгосон бөгөөд зөвшөөрч байна
        </CheckRow>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:13, color:'#374151', fontWeight:600, display:'block', marginBottom:5 }}>
            Бүтэн нэр (гарын үсгийн оронд)
          </label>
          <input value={sigName} onChange={e=>setSigName(e.target.value)} placeholder="Таны бүтэн нэр..."
            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, fontFamily:'inherit', outline:'none', background:'#FAFAFA' }}
            onFocus={e=>{e.target.style.borderColor='#1D9E75';e.target.style.background='#fff'}}
            onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#FAFAFA'}}
          />
        </div>

        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:13, color:'#374151', fontWeight:600, display:'block', marginBottom:5 }}>Гарын үсэг зурах</label>
          <canvas ref={canvasRef} width={340} height={80}
            style={{ border:'1.5px solid #E5E7EB', borderRadius:12, width:'100%', display:'block', cursor:'crosshair', background:'#FAFAFA', touchAction:'none' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
          <button onClick={clearCanvas} style={{ fontSize:12, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', marginTop:4 }}>✕ Дахин зурах</button>
        </div>
      </Card>

      <div id="recaptcha-container" />
      <Btn onClick={handleAccept} disabled={!checked || !sigName.trim() || loading}>
        {loading ? 'Хадгалж байна...' : '✅ Гэрээ зөвшөөрч үргэлжлүүлэх'}
      </Btn>
    </div>
  );
}
