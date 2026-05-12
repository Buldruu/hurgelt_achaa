// src/pages/customer/CustomerApp.jsx
import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { createOrder, listenCustomerOrders, listenDriverLocation, submitRating } from '../../firebase/db';
import {
  Card, CardTitle, Btn, InfoRow, Badge, FormInput, FormSelect,
  StarRating, BottomNav, TopBar, PageShell,
  EmptyState,
} from '../../components/common/UI';
import DeliveryMap from '../../components/map/DeliveryMap';
import { VEHICLE_MULTIPLIERS, calcPrice, calcDistance, formatPrice, getStatusLabel } from '../../utils/pricing';
import toast from 'react-hot-toast';
import { logout } from '../../firebase/auth';

const ITEM_TYPES = [
  { value: 'furniture',    label: '🛋️ Тавилга' },
  { value: 'construction', label: '🧱 Барилгын материал' },
  { value: 'appliance',    label: '📺 Цахилгаан хэрэгсэл' },
  { value: 'boxes',        label: '📦 Хайрцаг / Бага ачаа' },
  { value: 'equipment',    label: '⚙️ Тоног төхөөрөмж' },
  { value: 'other',        label: '🔖 Бусад' },
];

const UB_LOCATIONS = [
  { label: 'Сүхбаатар дүүрэг, 1-р хороо',      lat: 47.9138, lng: 106.9165 },
  { label: 'Баянзүрх дүүрэг, 5-р хороо',        lat: 47.9225, lng: 106.9600 },
  { label: 'Хан-Уул дүүрэг, 8-р хороо',         lat: 47.8871, lng: 106.9052 },
  { label: 'Чингэлтэй дүүрэг, 2-р хороо',       lat: 47.9260, lng: 106.9050 },
  { label: 'Сонгинохайрхан, 18-р хороо',        lat: 47.9350, lng: 106.8200 },
  { label: 'Налайх дүүрэг',                     lat: 47.7500, lng: 107.2400 },
  { label: 'Баянгол, 20-р хороо',               lat: 47.9000, lng: 106.8700 },
  { label: 'Багануур дүүрэг',                   lat: 47.7100, lng: 108.2800 },
];

const RATING_TAGS = [
  'Хурдан хүргэлт', 'Болгоомжтой', 'Цагтаа ирсэн',
  'Эелдэг жолооч', 'Сайн харилцаа', 'Хоцорсон',
  'Ачаа гэмтсэн', 'Муу харилцаа',
];

const STATUS_STEPS = [
  { key: 'pending',         icon: '📋', label: 'Захиалга үүслээ' },
  { key: 'accepted',        icon: '🤝', label: 'Жолооч авлаа' },
  { key: 'going_pickup',    icon: '🚗', label: 'Авах руу явж байна' },
  { key: 'arrived_pickup',  icon: '📍', label: 'Авах байршилд ирлээ' },
  { key: 'picked_up',       icon: '📦', label: 'Ачилт хийлээ' },
  { key: 'going_dropoff',   icon: '🚛', label: 'Хүргэж байна' },
  { key: 'arrived_dropoff', icon: '🏁', label: 'Хүргэх газарт ирлээ' },
  { key: 'completed',       icon: '✅', label: 'Хүргэлт дууслаа' },
];

export default function CustomerApp() {
  const { user, userProfile, setOrderHistory, orderHistory } = useStore();
  const [tab, setTab] = useState('home');

  // Захиалгын форм
  const [pickup,        setPickup]        = useState(UB_LOCATIONS[0]);
  const [dropoff,       setDropoff]       = useState(UB_LOCATIONS[2]);
  const [vehicleType,   setVehicleType]   = useState('pickup');
  const [itemType,      setItemType]      = useState('furniture');
  const [weight,        setWeight]        = useState('');
  const [note,          setNote]          = useState('');
  const [receiverName,  setReceiverName]  = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [loadingHelp,   setLoadingHelp]   = useState(false);
  const [urgent,        setUrgent]        = useState(false);
  const [night,         setNight]         = useState(false);
  const [legalConfirmed,setLegalConfirmed]= useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  // Tracking
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [driverPos,     setDriverPos]     = useState(null);

  // Rating
  const [ratingOrder, setRatingOrder] = useState(null);
  const [stars,       setStars]       = useState(0);
  const [tags,        setTags]        = useState([]);
  const [reviewText,  setReviewText]  = useState('');

  const dist  = calcDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const price = calcPrice(dist, vehicleType, { loadingHelp, urgent, night });

  useEffect(() => {
    if (!user) return;
    const unsub = listenCustomerOrders(user.uid, (orders) => {
      setOrderHistory(orders);
      const active = orders.find(o => !['completed','cancelled'].includes(o.status));
      if (active) setTrackingOrder(active);
    });
    return unsub;
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!trackingOrder?.driverId) return;
    const unsub = listenDriverLocation(trackingOrder.driverId, (data) => {
      if (data.location) setDriverPos({ lat: data.location.latitude, lng: data.location.longitude });
    });
    return unsub;
  }, [trackingOrder?.driverId]);

  async function handleCreateOrder() {
    if (!legalConfirmed)              { toast.error('Хуулийн баталгаажуулалт шаардлагатай'); return; }
    if (!receiverName || !receiverPhone) { toast.error('Хүлээн авагчийн мэдээлэл оруулна уу'); return; }
    setSubmitting(true);
    try {
      await createOrder({
        customerId:    user.uid,
        customerName:  userProfile?.name || '',
        customerPhone: userProfile?.phone || '',
        pickup:  { lat: pickup.lat,  lng: pickup.lng,  address: pickup.label },
        dropoff: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.label },
        vehicleType, itemType,
        weight: Number(weight) || 0,
        note, receiverName, receiverPhone,
        options: { loadingHelp, urgent, night },
        distanceKm: dist,
        price,
        paymentStatus: 'pending',
      });
      toast.success('Захиалга амжилттай үүслээ! 🎉');
      setTab('track');
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  async function handleSubmitRating() {
    if (!stars) { toast.error('Одоор үнэлнэ үү'); return; }
    try {
      await submitRating(ratingOrder.id, user.uid, ratingOrder.driverId, 'driver', { stars, tags, review: reviewText });
      toast.success('Үнэлгээ амжилттай өгөгдлөө ⭐');
      setRatingOrder(null);
      setTab('history');
    } catch (e) { toast.error(e.message); }
  }

  // ── Screens ─────────────────────────────────────────────────────────────────

  const screen = {

    // ══ НҮҮР ══════════════════════════════════════════════════════════════════
    home: (
      <>
        {/* Hero header */}
        <div style={{
          background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
          padding: '20px 16px 28px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: 20, bottom: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 2 }}>Сайн байна уу 👋</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{userProfile?.name || 'Хэрэглэгч'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 12px', fontSize: 12, color: '#fff', fontWeight: 700 }}>
              🚛 АчааЗам
            </div>
          </div>

          {/* Хурдан захиалах товч */}
          <div
            onClick={() => setTab('order')}
            style={{
              background: '#fff', borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ width: 42, height: 42, background: '#E1F5EE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Ачаа илгээх</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Хаана ч хүргэнэ</div>
            </div>
            <div style={{ fontSize: 20, color: '#1D9E75' }}>›</div>
          </div>
        </div>

        <div style={{ padding: '16px 14px 0' }}>

          {/* Идэвхтэй захиалга байвал харуулна */}
          {trackingOrder && !['completed','cancelled'].includes(trackingOrder.status) && (
            <div
              onClick={() => setTab('track')}
              style={{
                background: 'linear-gradient(135deg, #185FA5, #1249A0)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(24,95,165,0.3)',
              }}
            >
              <div style={{ fontSize: 28 }}>🚛</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Идэвхтэй хүргэлт</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {getStatusLabel(trackingOrder.status)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Дэлгэрэнгүй ›</div>
            </div>
          )}

          {/* Газрын зураг + чиглэл */}
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            <DeliveryMap
              pickup={{ lat: pickup.lat, lng: pickup.lng, label: pickup.label }}
              dropoff={{ lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label }}
              route={[[pickup.lat, pickup.lng],[dropoff.lat, dropoff.lng]]}
              height={170}
            />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                <FormSelect
                  value={pickup.label}
                  onChange={e => setPickup(UB_LOCATIONS.find(l => l.label === e.target.value))}
                  options={UB_LOCATIONS.map(l => ({ value: l.label, label: l.label }))}
                  style={{ margin: 0 }}
                />
              </div>
              <div style={{ width: 1, height: 12, background: '#E5E7EB', marginLeft: 4, marginBottom: 8 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#E24B4A', flexShrink: 0 }} />
                <FormSelect
                  value={dropoff.label}
                  onChange={e => setDropoff(UB_LOCATIONS.find(l => l.label === e.target.value))}
                  options={UB_LOCATIONS.map(l => ({ value: l.label, label: l.label }))}
                  style={{ margin: 0 }}
                />
              </div>
            </div>
          </Card>

          {/* Тээврийн хэрэгсэл сонгох */}
          <Card>
            <CardTitle>🚛 Тээврийн хэрэгсэл сонгох</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(VEHICLE_MULTIPLIERS).map(([k, v]) => (
                <div key={k} onClick={() => setVehicleType(k)} style={{
                  border: vehicleType === k ? '2px solid #1D9E75' : '1.5px solid #E5E7EB',
                  background: vehicleType === k ? '#E1F5EE' : '#FAFAFA',
                  borderRadius: 12, padding: '10px 6px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{v.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: vehicleType === k ? '#0F6E56' : '#374151' }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>≤{v.maxTon}т</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Үнийн тооцоо */}
          <div style={{
            background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
            borderRadius: 14, padding: '16px', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 4 }}>Тооцоолсон зардал</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                {dist.toFixed(1)} км · {VEHICLE_MULTIPLIERS[vehicleType]?.label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{formatPrice(price)}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Ойролцоо дүн</div>
            </div>
          </div>

          <Btn onClick={() => setTab('order')} style={{ fontSize: 15 }}>
            📦 Захиалга үүсгэх →
          </Btn>
        </div>
      </>
    ),

    // ══ ЗАХИАЛГА ҮҮСГЭХ ═══════════════════════════════════════════════════════
    order: (
      <>
        <TopBar title="Захиалга үүсгэх" subtitle="Дэлгэрэнгүй мэдээлэл" />
        <div style={{ padding: '14px 14px 0' }}>

          {/* Хүлээн авагч */}
          <Card>
            <CardTitle>👤 Хүлээн авагчийн мэдээлэл</CardTitle>
            <FormInput label="Нэр" placeholder="Бат-Эрдэнэ"
              value={receiverName} onChange={e => setReceiverName(e.target.value)} />
            <FormInput label="Утасны дугаар" type="tel" placeholder="9900 0000"
              value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} />
          </Card>

          {/* Ачааны мэдээлэл */}
          <Card>
            <CardTitle>📦 Ачааны мэдээлэл</CardTitle>
            <FormSelect label="Ачааны төрөл" value={itemType}
              onChange={e => setItemType(e.target.value)} options={ITEM_TYPES} />
            <FormInput label="Жин (кг)" type="number" placeholder="150"
              value={weight} onChange={e => setWeight(e.target.value)} />
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Тусгай тэмдэглэл</label>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Болгоомжтой зөөнө үү, ширэ хэврэг байна..." rows={2}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </Card>

          {/* Нэмэлт үйлчилгээ */}
          <Card>
            <CardTitle>✨ Нэмэлт үйлчилгээ</CardTitle>
            {[
              { id: 'load', state: loadingHelp, set: setLoadingHelp, icon: '💪', label: 'Ачих/буулгах тусламж', price: 15000 },
              { id: 'urg',  state: urgent,      set: setUrgent,      icon: '⚡', label: 'Яаралтай хүргэлт',    price: 20000 },
              { id: 'ngt',  state: night,       set: setNight,       icon: '🌙', label: 'Шөнийн хүргэлт',      price: 10000 },
            ].map(opt => (
              <div key={opt.id}
                onClick={() => opt.set(!opt.state)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', borderRadius: 10, marginBottom: 6,
                  border: opt.state ? '2px solid #1D9E75' : '1.5px solid #E5E7EB',
                  background: opt.state ? '#E1F5EE' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>+{formatPrice(opt.price)}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: opt.state ? '#1D9E75' : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {opt.state ? '✓' : ''}
                </div>
              </div>
            ))}
          </Card>

          {/* Хуулийн баталгаажуулалт */}
          <div
            onClick={() => setLegalConfirmed(!legalConfirmed)}
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '14px', borderRadius: 12, marginBottom: 12, cursor: 'pointer',
              border: legalConfirmed ? '2px solid #1D9E75' : '1.5px solid #FBBF24',
              background: legalConfirmed ? '#E1F5EE' : '#FFFBEB',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: legalConfirmed ? '#1D9E75' : '#fff',
              border: legalConfirmed ? 'none' : '2px solid #D97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 800,
            }}>
              {legalConfirmed ? '✓' : ''}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#374151' }}>
              🚫 Миний илгээж буй ачаа хуульд нийцсэн бөгөөд Монгол улсын хуулийг зөрчихгүй гэдгийг <strong>баталж байна.</strong>
            </div>
          </div>

          {/* Нийт дүн */}
          <div style={{
            background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
            borderRadius: 14, padding: '16px', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 2 }}>Нийт төлөх дүн</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{dist.toFixed(1)} км</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{formatPrice(price)}</div>
          </div>

          <Btn onClick={handleCreateOrder} disabled={submitting}>
            {submitting ? '⏳ Үүсгэж байна...' : '✅ Захиалга баталгаажуулах'}
          </Btn>
        </div>
      </>
    ),

    // ══ ХЯНАХ ═════════════════════════════════════════════════════════════════
    track: (
      <>
        <TopBar title="Хүргэлт хянах" subtitle="Бодит цагийн мэдээлэл" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          {!trackingOrder ? (
            <EmptyState icon="📭" title="Идэвхтэй захиалга байхгүй" sub="Захиалга үүсгэхийн тулд нүүр хуудас руу очно уу" />
          ) : (
            <>
              <DeliveryMap
                pickup={{ lat: trackingOrder.pickup?.lat, lng: trackingOrder.pickup?.lng, label: trackingOrder.pickup?.address }}
                dropoff={{ lat: trackingOrder.dropoff?.lat, lng: trackingOrder.dropoff?.lng, label: trackingOrder.dropoff?.address }}
                driverPos={driverPos}
                route={[[trackingOrder.pickup?.lat, trackingOrder.pickup?.lng],[trackingOrder.dropoff?.lat, trackingOrder.dropoff?.lng]]}
                followDriver height={220}
              />

              {/* Явцын алхам */}
              <Card style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <CardTitle style={{ margin: 0 }}>🚦 Явцын байдал</CardTitle>
                  <Badge variant={trackingOrder.status === 'completed' ? 'green' : 'blue'}>
                    {getStatusLabel(trackingOrder.status)}
                  </Badge>
                </div>
                <div style={{ position: 'relative' }}>
                  {STATUS_STEPS.map((s, i) => {
                    const stepIdx   = STATUS_STEPS.findIndex(x => x.key === trackingOrder.status);
                    const isDone    = i < stepIdx;
                    const isCurrent = i === stepIdx;
                    return (
                      <div key={s.key} style={{ display: 'flex', gap: 10, marginBottom: i < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            background: isCurrent ? '#185FA5' : isDone ? '#1D9E75' : '#F3F4F6',
                            border: isCurrent ? '3px solid #BFDBFE' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, transition: 'all 0.2s',
                          }}>
                            {isDone ? <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>✓</span> : s.icon}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div style={{ width: 2, height: 20, background: isDone ? '#1D9E75' : '#E5E7EB', transition: 'background 0.3s' }} />
                          )}
                        </div>
                        <div style={{ paddingTop: 5, paddingBottom: i < STATUS_STEPS.length - 1 ? 16 : 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: isCurrent ? 800 : isDone ? 600 : 400,
                            color: isCurrent ? '#185FA5' : isDone ? '#111' : '#9CA3AF',
                          }}>{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Жолоочийн мэдээлэл */}
              {trackingOrder.driverName && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #1249A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      {trackingOrder.driverName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{trackingOrder.driverName}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        🚛 {trackingOrder.driverPlate || '—'} · {'★'.repeat(Math.round(trackingOrder.driverRating || 5))} {trackingOrder.driverRating || '5.0'}
                      </div>
                    </div>
                    <a href={'tel:' + trackingOrder.driverPhone}
                      style={{ width: 44, height: 44, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 20 }}>
                      📞
                    </a>
                  </div>
                </Card>
              )}

              <Card>
                <InfoRow label="Авах байршил"   value={trackingOrder.pickup?.address} />
                <InfoRow label="Хүргэх байршил" value={trackingOrder.dropoff?.address} />
                <InfoRow label="Нийт зардал"    value={formatPrice(trackingOrder.price || 0)} valueStyle={{ color: '#1D9E75', fontWeight: 800 }} />
              </Card>

              {trackingOrder.status === 'completed' && (
                <Btn onClick={() => { setRatingOrder(trackingOrder); setTab('rating'); }}>
                  ⭐ Жолоочоо үнэлэх
                </Btn>
              )}
            </>
          )}
        </div>
      </>
    ),

    // ══ ТҮҮХ ══════════════════════════════════════════════════════════════════
    history: (
      <>
        <TopBar title="Хүргэлтийн түүх" />
        <div style={{ padding: '14px 14px 0' }}>
          {orderHistory.length === 0 ? (
            <EmptyState icon="🕐" title="Захиалгын түүх байхгүй" sub="Захиалга хийсний дараа энд харагдана" />
          ) : (
            <>
              {/* Хурдан статистик */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { icon: '📦', label: 'Нийт захиалга', val: orderHistory.length, color: '#185FA5' },
                  { icon: '✅', label: 'Дууссан', val: orderHistory.filter(o => o.status === 'completed').length, color: '#1D9E75' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {orderHistory.map(o => (
                <Card key={o.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>#{o.id?.slice(0, 8)}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{o.itemType} · {o.weight ? o.weight + ' кг' : ''}</div>
                    </div>
                    <Badge variant={o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : 'amber'}>
                      {getStatusLabel(o.status)}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontSize: 12, color: '#374151' }}>
                    <span style={{ color: '#1D9E75', fontWeight: 700 }}>●</span>{o.pickup?.address?.split(',')[0]}
                    <span style={{ color: '#9CA3AF' }}>→</span>
                    <span style={{ color: '#E24B4A', fontWeight: 700 }}>●</span>{o.dropoff?.address?.split(',')[0]}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1D9E75' }}>{formatPrice(o.price || 0)}</span>
                    {o.status === 'completed' && (
                      <button
                        onClick={() => { setRatingOrder(o); setTab('rating'); }}
                        style={{ background: '#FFF9E6', border: '1px solid #FCD34D', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#92400E', cursor: 'pointer', fontFamily: 'inherit' }}
                      >⭐ Үнэлэх</button>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </>
    ),

    // ══ ҮНЭЛГЭЭ ═══════════════════════════════════════════════════════════════
    rating: (
      <>
        <TopBar title="Үнэлгээ өгөх" subtitle={ratingOrder?.driverName || ''} />
        <div style={{ padding: '14px 14px 0' }}>
          {!ratingOrder ? (
            <EmptyState icon="⭐" title="Үнэлэх захиалга сонгоогүй" sub="Түүхийн хэсгээс үнэлэх" />
          ) : (
            <>
              <Card style={{ textAlign: 'center', padding: '24px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>Хүргэлт амжилттай!</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                  {ratingOrder.driverName} — жолооч таны ачааг хүргэлээ
                </div>
              </Card>

              <Card>
                <CardTitle>⭐ Одоор үнэлнэ үү</CardTitle>
                <StarRating value={stars} onChange={setStars} />

                <CardTitle style={{ marginTop: 14 }}>🏷️ Шошго сонгох</CardTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                  {RATING_TAGS.map(t => (
                    <span key={t}
                      onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'inherit', fontWeight: 600,
                        background: tags.includes(t) ? '#1D9E75' : '#F3F4F6',
                        color: tags.includes(t) ? '#fff' : '#374151',
                        border: 'none', transition: 'all 0.15s',
                      }}
                    >{t}</span>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>💬 Сэтгэгдэл бичих</label>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                    rows={3} placeholder="Жолоочийн үйлчилгээний талаар сэтгэгдлээ бичнэ үү..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </Card>

              <Btn onClick={handleSubmitRating}>⭐ Үнэлгээ илгээх</Btn>
            </>
          )}
        </div>
      </>
    ),

    // ══ ПРОФАЙЛ ═══════════════════════════════════════════════════════════════
    profile: (
      <>
        <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)', padding: '28px 20px 40px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.4)' }}>
            {userProfile?.name?.[0] || '?'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{userProfile?.name || 'Хэрэглэгч'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              📱 {userProfile?.phone || userProfile?.email || '—'}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 14px 0', marginTop: -16 }}>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '📦', label: 'Нийт захиалга', val: orderHistory.length },
                { icon: '✅', label: 'Дууссан', val: orderHistory.filter(o => o.status === 'completed').length },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <InfoRow label="Овог нэр"  value={userProfile?.name  || '—'} />
            <InfoRow label="Утас"      value={userProfile?.phone || '—'} />
            <InfoRow label="Имэйл"     value={userProfile?.email || '—'} />
            <InfoRow label="Гишүүнчлэл" value="Захиалагч" last />
          </Card>

          <Btn variant="outline" style={{ color: '#E24B4A', borderColor: '#E24B4A' }} onClick={logout}>
            🚪 Системээс гарах
          </Btn>
        </div>
      </>
    ),
  };

  return (
    <PageShell>
      {screen[tab] || screen.home}
      <BottomNav
        active={tab}
        onSelect={setTab}
        items={[
          { key: 'home',    icon: '🏠', label: 'Нүүр'    },
          { key: 'order',   icon: '➕', label: 'Захиалга' },
          { key: 'track',   icon: '📍', label: 'Хянах'   },
          { key: 'history', icon: '🕐', label: 'Түүх'    },
          { key: 'profile', icon: '👤', label: 'Профайл' },
        ]}
      />
    </PageShell>
  );
}
