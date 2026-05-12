// src/pages/AgreementPage.jsx
import React, { useRef, useState } from 'react';
import { Card, CardTitle, Btn, Alert } from '../components/common/UI';
import { saveAgreement } from '../firebase/db';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const TERMS = `1. ПЛАТФОРМЫН ҮҮРЭГ
АчааЗам платформ нь зөвхөн захиалагч болон жолоочийг холбох зуучлагч үүрэг гүйцэтгэнэ. Платформ нь тээвэрлэлтийг өөрөө гүйцэтгэхгүй.

2. ХЭРЭГЛЭГЧИЙН ХАРИУЦЛАГА
Захиалагч болон жолооч нь гүйлгээнд оролцож буй барааг хуульд нийцсэн эсэхийг бие даан баталгаажуулах үүрэгтэй. Хуулийн зөрчил гарсан тохиолдолд платформ ямар нэгэн хариуцлага хүлээхгүй. Хариуцлагатай этгээд нь зөрчил гаргасан захиалагч эсвэл жолооч байна.

3. ХОРИОТОЙ БАРАА
Мансууруулах бодис, зэвсэг, дэлбэрэх зүйл, хулгайлсан бараа, хуурамч баримт бичиг, хүн худалдаалахтай холбоотой зүйл, зөвшөөрөлгүй аюултай материал болон Монгол улсын хуулиар хориглосон аливаа барааг тээвэрлэхийг хатуу хориглоно.

4. ПЛАТФОРМЫН ЭРХ
Платформ нь дараах тохиолдолд хэрэглэгчийг блоклох, хассан хуулийн байгууллагад мэдэгдэх эрхтэй: хуурамч мэдээлэл өгсөн, хориотой бараа тээвэрлэсэн, залилан мэхлэсэн, бусдад хохирол учруулсан.

5. ТӨЛБӨРИЙН НӨХЦӨЛ
Захиалагч захиалга баталгаажуулахад төлбөр хийнэ. Платформ мөнгийг хадгалж, хүргэлт дуусч нотлох зураг байршуулсны дараа жолоочид шилжүүлнэ. Маргааны үед платформ шийдвэр гаргах эрхтэй.

6. МЭДЭЭЛЭЛ ХАДГАЛАЛТ
Гэрээний огноо, цаг, хэрэглэгчийн ID, утасны дугаар болон төхөөрөмжийн мэдээлэл хадгалагдана. Энэхүү мэдээлэл нь маргаан, хэрэг хянан шийдвэрлэлтэд ашиглагдах болно.`;

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
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const [x, y] = getXY(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(x, y);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#1D9E75'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const [x, y] = getXY(e, canvasRef.current);
    ctx.lineTo(x, y); ctx.stroke();
  }

  function stopDraw() { drawing.current = false; }
  function clearCanvas() {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  }

  async function handleAccept() {
    if (!checked || !sigName.trim()) {
      toast.error('Нэрээ бичиж, нөхцөлийг зөвшөөрнө үү');
      return;
    }
    setLoading(true);
    try {
      await saveAgreement(user?.uid || 'anon', role, {
        userAgent: navigator.userAgent,
        signedName: sigName,
      });
      toast.success('Гэрээ амжилттай зөвшөөрөгдлөө');
      onAccepted?.();
    } catch (err) {
      toast.error('Алдаа гарлаа: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: '14px 14px 80px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Үйлчилгээний нөхцөл</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            Үргэлжлүүлэхийн тулд гэрээ зөвшөөрөх шаардлагатай
          </div>
        </div>

        <div style={{
          maxHeight: 200, overflowY: 'auto',
          border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
          padding: '10px 12px', fontSize: 12.5, color: '#6B7280',
          lineHeight: 1.8, marginBottom: 12, background: '#FAFAFA',
          whiteSpace: 'pre-line',
        }}>
          {TERMS}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            id="agree"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1D9E75' }}
          />
          <label htmlFor="agree" style={{ fontSize: 13, lineHeight: 1.5 }}>
            Би дээрх үйлчилгээний нөхцлийг бүрэн уншиж ойлгосон бөгөөд зөвшөөрч байна
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Бүтэн нэр (гарын үсгийн оронд)
          </label>
          <input
            value={sigName}
            onChange={(e) => setSigName(e.target.value)}
            placeholder="Таны бүтэн нэр..."
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Гарын үсэг зурах
          </label>
          <canvas
            ref={canvasRef}
            width={360} height={80}
            style={{
              border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
              width: '100%', display: 'block', cursor: 'crosshair',
              background: '#FAFAFA', touchAction: 'none',
            }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
          <button
            onClick={clearCanvas}
            style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
          >
            ✕ Дахин зурах
          </button>
        </div>
      </Card>

      <div id="recaptcha-container" />

      <Btn onClick={handleAccept} disabled={!checked || !sigName.trim() || loading}>
        {loading ? 'Хадгалж байна...' : '✅ Гэрээ зөвшөөрч үргэлжлүүлэх'}
      </Btn>
    </div>
  );
}
