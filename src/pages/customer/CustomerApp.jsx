// src/pages/customer/CustomerApp.jsx
import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { createOrder, listenCustomerOrders, listenDriverLocation, submitRating } from '../../firebase/db';
import { Card, CardTitle, Btn, InfoRow, Badge, FormInput, FormSelect, StarRating, Alert, BottomNav, TopBar, PageShell, StatusTimeline, Spinner } from '../../components/common/UI';
import DeliveryMap from '../../components/map/DeliveryMap';
import { VEHICLE_MULTIPLIERS, calcPrice, calcDistance, formatPrice, getStatusLabel } from '../../utils/pricing';
import { serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { logout } from '../../firebase/auth';

const VEHICLE_OPTIONS = Object.entries(VEHICLE_MULTIPLIERS).map(([k, v]) => ({
  value: k, label: v.label,
}));

const ITEM_TYPES = [
  { value: 'furniture',     label: 'Тавилга' },
  { value: 'construction',  label: 'Барилгын материал' },
  { value: 'appliance',     label: 'Цахилгаан хэрэгсэл' },
  { value: 'boxes',         label: 'Хайрцаг / Бага ачаа' },
  { value: 'equipment',     label: 'Тоног төхөөрөмж' },
  { value: 'other',         label: 'Бусад' },
];

// UB districts for demo address picker
const UB_LOCATIONS = [
  { label: 'Сүхбаатар дүүрэг, 1-р хороо',   lat: 47.9138, lng: 106.9165 },
  { label: 'Баянзүрх дүүрэг, 5-р хороо',     lat: 47.9225, lng: 106.9600 },
  { label: 'Хан-Уул дүүрэг, 8-р хороо',      lat: 47.8871, lng: 106.9052 },
  { label: 'Чингэлтэй дүүрэг, 2-р хороо',    lat: 47.9260, lng: 106.9050 },
  { label: 'Сонгинохайрхан, 18-р хороо',     lat: 47.9350, lng: 106.8200 },
  { label: 'Налайх дүүрэг',                  lat: 47.7500, lng: 107.2400 },
];

export default function CustomerApp() {
  const { user, userProfile, setOrderHistory, orderHistory } = useStore();
  const [tab, setTab] = useState('home');

  // Order form state
  const [pickup, setPickup]   = useState(UB_LOCATIONS[0]);
  const [dropoff, setDropoff] = useState(UB_LOCATIONS[2]);
  const [vehicleType, setVehicleType]   = useState('pickup');
  const [itemType, setItemType]         = useState('furniture');
  const [weight, setWeight]             = useState('');
  const [note, setNote]                 = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [loadingHelp, setLoadingHelp]   = useState(false);
  const [urgent, setUrgent]             = useState(false);
  const [night, setNight]               = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Tracking
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingOrder, setTrackingOrder]     = useState(null);
  const [driverPos, setDriverPos]             = useState(null);

  // Rating
  const [ratingOrder, setRatingOrder] = useState(null);
  const [stars, setStars]             = useState(0);
  const [tags, setTags]               = useState([]);
  const [reviewText, setReviewText]   = useState('');

  const dist = calcDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const price = calcPrice(dist, vehicleType, { loadingHelp, urgent, night });

  // Listen to customer orders
  useEffect(() => {
    if (!user) return;
    const unsub = listenCustomerOrders(user.uid, (orders) => {
      setOrderHistory(orders);
      const active = orders.find((o) =>
        !['completed', 'cancelled'].includes(o.status)
      );
      if (active) { setTrackingOrderId(active.id); setTrackingOrder(active); }
    });
    return unsub;
  }, [user]);

  // Listen to driver location for active order
  useEffect(() => {
    if (!trackingOrder?.driverId) return;
    const unsub = listenDriverLocation(trackingOrder.driverId, (data) => {
      if (data.location) {
        setDriverPos({ lat: data.location.latitude, lng: data.location.longitude });
      }
    });
    return unsub;
  }, [trackingOrder?.driverId]);

  async function handleCreateOrder() {
    if (!legalConfirmed) { toast.error('Хуулийн баталгаажуулалт шаардлагатай'); return; }
    if (!receiverName || !receiverPhone) { toast.error('Хүлээн авагчийн мэдээлэл оруулна уу'); return; }
    setSubmitting(true);
    try {
      await createOrder({
        customerId: user.uid,
        customerName: userProfile?.name || '',
        customerPhone: userProfile?.phone || '',
        pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.label },
        dropoff: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.label },
        vehicleType,
        itemType,
        weight: Number(weight) || 0,
        note,
        receiverName,
        receiverPhone,
        options: { loadingHelp, urgent, night },
        distanceKm: dist,
        price,
        paymentStatus: 'pending',
      });
      toast.success('Захиалга амжилттай үүсэлсэн!');
      setTab('track');
      setSubmitting(false);
    } catch (e) {
      toast.error(e.message);
      setSubmitting(false);
    }
  }

  const RATING_TAGS = [
    'Хурдан хүргэлт', 'Болгоомжтой', 'Цагтаа ирсэн',
    'Эелдэг жолооч', 'Сайн харилцаа', 'Хоцорсон',
    'Ачаа гэмтсэн', 'Муу харилцаа',
  ];

  async function handleSubmitRating() {
    if (!stars) { toast.error('Одоор үнэлнэ үү'); return; }
    try {
      await submitRating(ratingOrder.id, user.uid, ratingOrder.driverId, 'driver', {
        stars, tags, review: reviewText,
      });
      toast.success('Үнэлгээ амжилттай өгөгдлөө');
      setRatingOrder(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  // ── SCREENS ───────────────────────────────────────────────────────────────
  const screen = {
    home: (
      <>
        <TopBar title="АчааЗам" subtitle="Ачааны том тээврийн үйлчилгээ" />
        <div style={{ padding: '14px 14px 0' }}>
          <DeliveryMap
            pickup={{ lat: pickup.lat, lng: pickup.lng, label: pickup.label }}
            dropoff={{ lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label }}
            route={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
          />

          {/* Pickup */}
          <Card>
            <CardTitle>📍 Байршил</CardTitle>
            <FormSelect
              label="Авах байршил"
              value={pickup.label}
              onChange={(e) => setPickup(UB_LOCATIONS.find((l) => l.label === e.target.value))}
              options={UB_LOCATIONS.map((l) => ({ value: l.label, label: l.label }))}
            />
            <FormSelect
              label="Хүргэх байршил"
              value={dropoff.label}
              onChange={(e) => setDropoff(UB_LOCATIONS.find((l) => l.label === e.target.value))}
              options={UB_LOCATIONS.map((l) => ({ value: l.label, label: l.label }))}
            />
          </Card>

          {/* Vehicle */}
          <Card>
            <CardTitle>🚛 Тээврийн хэрэгсэл</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(VEHICLE_MULTIPLIERS).map(([k, v]) => (
                <div
                  key={k}
                  onClick={() => setVehicleType(k)}
                  style={{
                    border: vehicleType === k ? '2px solid #1D9E75' : '1.5px solid rgba(0,0,0,0.1)',
                    background: vehicleType === k ? '#E1F5EE' : '#fff',
                    borderRadius: 10, padding: 10, cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>
                    {k === 'pickup' ? '🛻' : k === 'van' ? '🚐' : k === 'porter' ? '🚚' : '🚛'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{v.label.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>до {v.maxTon}т</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Price */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            border: '1px solid #9FE1CB',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F6E56' }}>Тооцоолсон зардал</div>
              <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>
                {dist.toFixed(1)} км · {VEHICLE_MULTIPLIERS[vehicleType]?.label.split(' ')[0]}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#085041' }}>{formatPrice(price)}</div>
          </div>

          <Btn onClick={() => setTab('order')}>📦 Хүргэлт үүсгэх →</Btn>
        </div>
      </>
    ),

    order: (
      <>
        <TopBar title="Захиалга үүсгэх" subtitle="Дэлгэрэнгүй мэдээлэл оруулна уу" />
        <div style={{ padding: '14px 14px 0' }}>
          <Card>
            <CardTitle>👤 Хүлээн авагч</CardTitle>
            <FormInput label="Нэр" placeholder="Бат-Эрдэнэ" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            <FormInput label="Утасны дугаар" type="tel" placeholder="9900 0000" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
          </Card>

          <Card>
            <CardTitle>📦 Ачааны мэдээлэл</CardTitle>
            <FormSelect label="Ачааны төрөл" value={itemType} onChange={(e) => setItemType(e.target.value)} options={ITEM_TYPES} />
            <FormInput label="Жин (кг)" type="number" placeholder="150" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Тусгай тэмдэглэл</label>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Болгоомжтой зөөнө үү..."
                rows={2}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>🛠️ Нэмэлт үйлчилгээ</CardTitle>
            {[
              { id: 'load', state: loadingHelp, set: setLoadingHelp, label: `Ачих/буулгах тусламж (+${formatPrice(15000)})` },
              { id: 'urg',  state: urgent,      set: setUrgent,      label: `Яаралтай хүргэлт (+${formatPrice(20000)})` },
              { id: 'ngt',  state: night,       set: setNight,       label: `Шөнийн хүргэлт (+${formatPrice(10000)})` },
            ].map((opt) => (
              <div key={opt.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <input type="checkbox" id={opt.id} checked={opt.state} onChange={(e) => opt.set(e.target.checked)} style={{ marginTop: 2, accentColor: '#1D9E75' }} />
                <label htmlFor={opt.id} style={{ fontSize: 13 }}>{opt.label}</label>
              </div>
            ))}
          </Card>

          <Alert variant="red">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input type="checkbox" id="legal" checked={legalConfirmed} onChange={(e) => setLegalConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: '#E24B4A' }} />
              <label htmlFor="legal" style={{ fontSize: 12, fontWeight: 600 }}>
                🚫 Миний илгээж буй ачаа хуульд нийцсэн бөгөөд Монгол улсын хуулийг зөрчихгүй гэдгийг баталж байна.
              </label>
            </div>
          </Alert>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #9FE1CB' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F6E56' }}>Нийт зардал</div>
              <div style={{ fontSize: 11, color: '#0F6E56' }}>{dist.toFixed(1)} км</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#085041' }}>{formatPrice(price)}</div>
          </div>

          <Btn onClick={handleCreateOrder} disabled={submitting}>
            {submitting ? 'Үүсгэж байна...' : '✅ Захиалга баталгаажуулах'}
          </Btn>
        </div>
      </>
    ),

    track: (
      <>
        <TopBar title="Хүргэлт хянах" subtitle="Бодит цагийн мэдээлэл" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          {!trackingOrder ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                Одоогоор идэвхтэй захиалга байхгүй
              </div>
            </Card>
          ) : (
            <>
              <DeliveryMap
                pickup={{ lat: trackingOrder.pickup?.lat, lng: trackingOrder.pickup?.lng, label: trackingOrder.pickup?.address }}
                dropoff={{ lat: trackingOrder.dropoff?.lat, lng: trackingOrder.dropoff?.lng, label: trackingOrder.dropoff?.address }}
                driverPos={driverPos}
                route={[
                  [trackingOrder.pickup?.lat, trackingOrder.pickup?.lng],
                  [trackingOrder.dropoff?.lat, trackingOrder.dropoff?.lng],
                ]}
                followDriver
                height={200}
              />

              {trackingOrder.driverName && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                      {trackingOrder.driverName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{trackingOrder.driverName}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{trackingOrder.vehicleType} · {trackingOrder.driverPlate}</div>
                      <div style={{ fontSize: 13, color: '#BA7517' }}>{'★'.repeat(Math.round(trackingOrder.driverRating || 5))} {trackingOrder.driverRating}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`tel:${trackingOrder.driverPhone}`} style={{ padding: '8px 12px', background: '#E1F5EE', color: '#0F6E56', borderRadius: 8, textDecoration: 'none', fontSize: 18 }}>📞</a>
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <CardTitle>🚦 Хүргэлтийн явц</CardTitle>
                <StatusTimeline statuses={[]} currentStatus={trackingOrder.status} />
              </Card>

              <Card>
                <CardTitle>📋 Захиалгын дэлгэрэнгүй</CardTitle>
                <InfoRow label="Дугаар" value={trackingOrder.id?.slice(0, 10) + '...'} />
                <InfoRow label="Авах байршил" value={trackingOrder.pickup?.address} />
                <InfoRow label="Хүргэх байршил" value={trackingOrder.dropoff?.address} />
                <InfoRow label="Нийт зардал" value={formatPrice(trackingOrder.price || 0)} valueStyle={{ color: '#1D9E75' }} />
              </Card>

              {trackingOrder.status === 'completed' && !ratingOrder && (
                <Btn onClick={() => { setRatingOrder(trackingOrder); setTab('rating'); }}>
                  ⭐ Жолоочоо үнэлэх
                </Btn>
              )}
            </>
          )}
        </div>
      </>
    ),

    history: (
      <>
        <TopBar title="Хүргэлтийн түүх" />
        <div style={{ padding: '14px 14px 0' }}>
          {orderHistory.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Захиалгын түүх байхгүй</div></Card>
          ) : orderHistory.map((o) => (
            <Card key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>#{o.id?.slice(0, 8)}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{o.itemType}</div>
                </div>
                <Badge variant={o.status === 'completed' ? 'green' : o.status === 'pending' ? 'amber' : 'blue'}>
                  {getStatusLabel(o.status)}
                </Badge>
              </div>
              <InfoRow label="Авах" value={o.pickup?.address} />
              <InfoRow label="Хүргэх" value={o.dropoff?.address} />
              <InfoRow label="Үнэ" value={formatPrice(o.price || 0)} valueStyle={{ color: '#1D9E75' }} />
              {o.status === 'completed' && (
                <Btn style={{ marginTop: 8, padding: 8, fontSize: 13 }} onClick={() => { setRatingOrder(o); setTab('rating'); }}>
                  ⭐ Үнэлгээ өгөх
                </Btn>
              )}
            </Card>
          ))}
        </div>
      </>
    ),

    rating: (
      <>
        <TopBar title="Үнэлгээ өгөх" subtitle={ratingOrder?.driverName || ''} />
        <div style={{ padding: '14px 14px 0' }}>
          {!ratingOrder ? (
            <Card><div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Үнэлэх захиалга сонгоогүй байна</div></Card>
          ) : (
            <>
              <Card style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>Хүргэлт амжилттай!</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Жолоочоо үнэлж сэтгэгдлээ үлдээнэ үү</div>
              </Card>
              <Card>
                <CardTitle>⭐ Одоор үнэлнэ үү</CardTitle>
                <StarRating value={stars} onChange={setStars} />
                <CardTitle style={{ marginTop: 10 }}>Шошго сонгох</CardTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
                  {RATING_TAGS.map((t) => (
                    <span
                      key={t}
                      onClick={() => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                      style={{
                        padding: '5px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit',
                        background: tags.includes(t) ? '#1D9E75' : '#fff',
                        color: tags.includes(t) ? '#fff' : '#6B7280',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Сэтгэгдэл</label>
                  <textarea
                    value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    rows={3} placeholder="Сэтгэгдэл бичнэ үү..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </Card>
              <Btn onClick={handleSubmitRating}>⭐ Үнэлгээ өгөх</Btn>
            </>
          )}
        </div>
      </>
    ),

    profile: (
      <>
        <TopBar title="Профайл" />
        <div style={{ padding: '14px 14px 0' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 auto 10px' }}>
              {userProfile?.name?.[0] || '?'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{userProfile?.name || 'Нэр байхгүй'}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>📱 {userProfile?.phone}</div>
          </Card>
          <Card>
            <InfoRow label="Нийт захиалга" value={orderHistory.length} />
            <InfoRow label="Дууссан" value={orderHistory.filter((o) => o.status === 'completed').length} />
          </Card>
          <Btn variant="outline" style={{ color: '#E24B4A', borderColor: '#E24B4A' }} onClick={logout}>
            🚪 Гарах
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
