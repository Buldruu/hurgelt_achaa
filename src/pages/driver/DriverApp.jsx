// src/pages/driver/DriverApp.jsx
import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import {
  listenAvailableOrders, listenDriverOrders, updateOrderStatus,
  updateDriverLocation, createDriverProfile, uploadFile,
  createShopOrder, listenDriverShopOrders,
  createHelpRequest, listenDriverHelpRequests,
} from '../../firebase/db';
import { Card, CardTitle, Btn, InfoRow, Badge, FormInput, FormSelect, Alert, BottomNav, TopBar, PageShell, StatusTimeline } from '../../components/common/UI';
import DeliveryMap from '../../components/map/DeliveryMap';
import { VEHICLE_MULTIPLIERS, formatPrice, getStatusLabel } from '../../utils/pricing';
import toast from 'react-hot-toast';
import { logout } from '../../firebase/auth';

const NEXT_STATUS = {
  accepted:        { key: 'going_pickup',    label: '🚗 Авах байршил руу хөдлөх' },
  going_pickup:    { key: 'arrived_pickup',  label: '📍 Авах байршилд ирлээ' },
  arrived_pickup:  { key: 'picked_up',       label: '📦 Ачилт хийлээ' },
  picked_up:       { key: 'going_dropoff',   label: '🚗 Хүргэх байршил руу хөдлөх' },
  going_dropoff:   { key: 'arrived_dropoff', label: '📍 Хүргэх байршилд ирлээ' },
  arrived_dropoff: { key: 'completed',       label: '✅ Хүргэлт дуусгах' },
};

// ─── Дэлгүүрийн категориуд ─────────────────────────────────────────────────
const SHOP_CATEGORIES = [
  {
    id: 'parts', icon: '🔧', label: 'Машины эд анги',
    items: [
      { name: 'Тос (5L)', price: 45000 },
      { name: 'Шүүлтүүр', price: 15000 },
      { name: 'Тормозны шингэн', price: 12000 },
      { name: 'Акумулятор', price: 120000 },
      { name: 'Дугуй (1ш)', price: 180000 },
      { name: 'Гэрлийн чийдэн', price: 8000 },
      { name: 'Арчигч', price: 25000 },
      { name: 'V-бүс', price: 18000 },
    ],
  },
  {
    id: 'tools', icon: '🛠️', label: 'Хэрэгсэл & Зам',
    items: [
      { name: 'Буксир трос', price: 22000 },
      { name: 'Дугуй засах иж бүрдэл', price: 35000 },
      { name: 'Гар помп', price: 28000 },
      { name: 'Аяга усны сав', price: 5000 },
      { name: 'Анхны тусламжийн иж', price: 18000 },
      { name: 'Аюулын гурвалжин', price: 12000 },
      { name: 'Жижиг гэрэлт жишгүүр', price: 9000 },
    ],
  },
  {
    id: 'food', icon: '🍱', label: 'Хоол & Ундаа',
    items: [
      { name: 'Хоолны өдрийн багц', price: 12000 },
      { name: 'Кофе (нэг удаагийн)', price: 3500 },
      { name: 'Энергийн ундаа', price: 4500 },
      { name: 'Гурил, давс (зам дээрх)', price: 8000 },
      { name: 'Лааз хоол', price: 5000 },
    ],
  },
];

// ─── Тусламжийн төрлүүд ────────────────────────────────────────────────────
const HELP_TYPES = [
  { key: 'breakdown',  icon: '🔴', label: 'Машин эвдэрсэн',      desc: 'Техникийн тусламж дуудах' },
  { key: 'accident',   icon: '🚨', label: 'Осол гарсан',          desc: 'Яаралтай тусламж' },
  { key: 'stuck',      icon: '🟡', label: 'Газар гачигдсан',      desc: 'Буксир / Татах машин' },
  { key: 'fuel',       icon: '⛽', label: 'Шатахуун дуусчихсан',   desc: 'Шатахуун хүргүүлэх' },
  { key: 'medical',    icon: '🏥', label: 'Эрүүл мэндийн яаралтай', desc: '103 болон тусламж' },
  { key: 'police',     icon: '👮', label: 'Цагдаа дуудах',        desc: '102 холбоо барих' },
  { key: 'other',      icon: '💬', label: 'Бусад тусламж',        desc: 'Оператортой холбогдох' },
];

export default function DriverApp() {
  const { user, userProfile, driverProfile } = useStore();
  const [tab, setTab] = useState('orders');

  // Захиалга
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders]               = useState([]);
  const [activeOrder, setActiveOrder]         = useState(null);
  const [proofFile, setProofFile]             = useState(null);
  const [uploading, setUploading]             = useState(false);
  const [trackingActive, setTrackingActive]   = useState(false);

  // Дэлгүүр
  const [shopCat, setShopCat]         = useState(null);   // сонгосон категори
  const [cart, setCart]               = useState([]);      // {name, price, qty}
  const [shopOrders, setShopOrders]   = useState([]);
  const [shopNote, setShopNote]       = useState('');
  const [shopLoading, setShopLoading] = useState(false);

  // Тусламж
  const [helpType, setHelpType]       = useState(null);
  const [helpNote, setHelpNote]       = useState('');
  const [helpLoc, setHelpLoc]         = useState('');
  const [helpRequests, setHelpRequests] = useState([]);
  const [helpLoading, setHelpLoading] = useState(false);

  // Бүртгэлийн форм
  const [regForm, setRegForm] = useState({
    name: '', phone: '', idNumber: '',
    vehicleType: 'pickup', vehicleBrand: '', vehicleModel: '',
    vehiclePlate: '', vehicleCapacity: '',
    bankName: 'Хаан банк', bankAccount: '', bankOwner: '',
  });
  const [legalOk, setLegalOk] = useState(false);

  // ── Subscriptions ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (driverProfile?.status !== 'approved') return;
    const vType = driverProfile?.vehicleType || 'pickup';
    const unsub = listenAvailableOrders(vType, setAvailableOrders);
    return unsub;
  }, [driverProfile]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDriverOrders(user.uid, (orders) => {
      setMyOrders(orders);
      const active = orders.find((o) => !['completed','cancelled'].includes(o.status) && o.status !== 'pending');
      if (active) setActiveOrder(active);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDriverShopOrders(user.uid, setShopOrders);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDriverHelpRequests(user.uid, setHelpRequests);
    return unsub;
  }, [user]);

  // GPS tracking
  useEffect(() => {
    if (!activeOrder || !trackingActive) return;
    const uid = user?.uid;
    const id = navigator.geolocation.watchPosition(
      (pos) => updateDriverLocation(uid, pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activeOrder, trackingActive, user?.uid]);

  // ── Захиалгын actions ──────────────────────────────────────────────────────

  async function acceptOrder(order) {
    try {
      await updateOrderStatus(order.id, 'accepted', {
        driverId: user.uid,
        driverName: driverProfile?.name || userProfile?.name || '',
        driverPhone: userProfile?.phone || '',
        driverRating: driverProfile?.rating || 5,
        driverPlate: driverProfile?.vehiclePlate || '',
      });
      setActiveOrder({ ...order, status: 'accepted', driverId: user.uid });
      setTrackingActive(true);
      setTab('active');
      toast.success('Захиалга авлаа!');
    } catch (e) { toast.error(e.message); }
  }

  async function advanceStatus() {
    if (!activeOrder) return;
    const next = NEXT_STATUS[activeOrder.status];
    if (!next) return;
    if (next.key === 'completed') {
      if (!proofFile) { toast.error('Нотлох зураг байршуулна уу'); return; }
      setUploading(true);
      try {
        const url = await uploadFile('proofs/' + activeOrder.id, proofFile);
        await updateOrderStatus(activeOrder.id, 'completed', { proofPhotoUrl: url, completedAt: new Date() });
        setActiveOrder(null);
        setTrackingActive(false);
        toast.success('Хүргэлт амжилттай дуусгалаа!');
        setTab('orders');
      } catch (e) { toast.error(e.message); }
      setUploading(false);
    } else {
      await updateOrderStatus(activeOrder.id, next.key);
      setActiveOrder((prev) => ({ ...prev, status: next.key }));
      toast.success(next.label);
    }
  }

  // ── Бүртгэл ───────────────────────────────────────────────────────────────

  async function handleRegister() {
    if (!legalOk) { toast.error('Гэрээ зөвшөөрөх шаардлагатай'); return; }
    try {
      await createDriverProfile(user.uid, {
        ...regForm, userId: user.uid,
        phone: userProfile?.phone || regForm.phone,
      });
      toast.success('Бүртгэл амжилттай илгээгдлээ! Баталгаажуулалт хүлээнэ үү.');
    } catch (e) { toast.error(e.message); }
  }

  // ── Дэлгүүр ───────────────────────────────────────────────────────────────

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.name === item.name);
      if (existing) return prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(item.name + ' нэмэгдлээ');
  }

  function removeFromCart(name) {
    setCart(prev => prev.filter(c => c.name !== name));
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  async function handleShopOrder() {
    if (cart.length === 0) { toast.error('Барааг сонгоно уу'); return; }
    setShopLoading(true);
    try {
      await createShopOrder({
        driverId: user.uid,
        driverName: driverProfile?.name || userProfile?.name || '',
        driverPhone: userProfile?.phone || '',
        items: cart,
        total: cartTotal,
        note: shopNote,
        deliveryAddress: driverProfile?.vehiclePlate ? 'Машин: ' + driverProfile.vehiclePlate : 'Жолооч',
      });
      setCart([]);
      setShopNote('');
      setShopCat(null);
      toast.success('Захиалга амжилттай илгээгдлээ! 📦');
    } catch (e) { toast.error(e.message); }
    setShopLoading(false);
  }

  // ── Тусламж ───────────────────────────────────────────────────────────────

  async function handleSendHelp() {
    if (!helpType) { toast.error('Тусламжийн төрлийг сонгоно уу'); return; }
    setHelpLoading(true);

    // Яаралтай тохиолдолд шууд залгана
    if (helpType.key === 'medical') { window.location.href = 'tel:103'; setHelpLoading(false); return; }
    if (helpType.key === 'police')  { window.location.href = 'tel:102'; setHelpLoading(false); return; }

    try {
      // GPS байршил авах
      let locStr = helpLoc;
      if (!locStr) {
        await new Promise(resolve => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { locStr = pos.coords.latitude.toFixed(5) + ', ' + pos.coords.longitude.toFixed(5); resolve(); },
            () => { locStr = 'Байршил тодорхойгүй'; resolve(); },
          );
        });
      }
      await createHelpRequest({
        driverId: user.uid,
        driverName: driverProfile?.name || userProfile?.name || '',
        driverPhone: userProfile?.phone || '',
        vehiclePlate: driverProfile?.vehiclePlate || '',
        type: helpType.key,
        typeLabel: helpType.label,
        location: locStr,
        note: helpNote,
      });
      setHelpType(null);
      setHelpNote('');
      setHelpLoc('');
      toast.success('Тусламжийн хүсэлт илгээгдлээ! Оператор холбогдоно 📞');
    } catch (e) { toast.error(e.message); }
    setHelpLoading(false);
  }

  // ── SCREENS ────────────────────────────────────────────────────────────────

  const screen = {

    // ── Захиалга ──────────────────────────────────────────────────────────
    orders: (
      <>
        <TopBar title="Захиалга хайх" subtitle="Ойролцоо боломжтой захиалгууд" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          {driverProfile?.status !== 'approved' && (
            <Alert variant="amber">
              ⚠️ Таны бүртгэл баталгаажаагүй байна. Захиалга авахын тулд бүртгэлийн хэсгийг бөглөнө үү.
            </Alert>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Ойролцоо захиалга{' '}
              <span style={{ background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                {availableOrders.length}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 700 }}>🟢 Онлайн</div>
          </div>

          {availableOrders.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                Ойролцоо захиалга байхгүй байна
              </div>
            </Card>
          ) : availableOrders.map((o) => (
            <Card key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>#{o.id?.slice(0, 10)}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{o.itemType} · {o.weight || '?'} кг</div>
                </div>
                <Badge variant="green">Боломжтой</Badge>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                  <span style={{ color: '#1D9E75', fontSize: 8 }}>●</span>{o.pickup?.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                  <span style={{ color: '#E24B4A', fontSize: 8 }}>●</span>{o.dropoff?.address}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>📍 {o.distanceKm?.toFixed(1)} км</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1D9E75' }}>{formatPrice(o.price || 0)}</span>
              </div>
              {o.note && <Alert variant="amber"><span style={{ fontSize: 11 }}>📝 {o.note}</span></Alert>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => toast('Захиалга татгалзагдлаа')}
                >✕ Татгалзах</button>
                <button
                  style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => acceptOrder(o)}
                >✓ Авах</button>
              </div>
            </Card>
          ))}
        </div>
      </>
    ),

    // ── Идэвхтэй хүргэлт ──────────────────────────────────────────────────
    active: (
      <>
        <TopBar title="Идэвхтэй хүргэлт" subtitle={activeOrder ? '#' + activeOrder.id?.slice(0, 10) : ''} color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          {!activeOrder ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                Идэвхтэй захиалга байхгүй
              </div>
            </Card>
          ) : (
            <>
              <DeliveryMap
                pickup={{ lat: activeOrder.pickup?.lat, lng: activeOrder.pickup?.lng, label: activeOrder.pickup?.address }}
                dropoff={{ lat: activeOrder.dropoff?.lat, lng: activeOrder.dropoff?.lng, label: activeOrder.dropoff?.address }}
                height={200}
              />
              <Card>
                <CardTitle>📋 Захиалгын дэлгэрэнгүй</CardTitle>
                <InfoRow label="Ачааны төрөл" value={activeOrder.itemType} />
                <InfoRow label="Жин" value={(activeOrder.weight || '?') + ' кг'} />
                <InfoRow label="Захиалагч" value={activeOrder.customerName} />
                <InfoRow label="Утас" value={
                  <a href={'tel:' + activeOrder.customerPhone} style={{ color: '#185FA5' }}>
                    📞 {activeOrder.customerPhone}
                  </a>
                } />
                <InfoRow label="Авах байршил" value={activeOrder.pickup?.address} />
                <InfoRow label="Хүргэх байршил" value={activeOrder.dropoff?.address} />
                <InfoRow label="Дүн" value={formatPrice(activeOrder.price || 0)} valueStyle={{ color: '#1D9E75' }} />
              </Card>
              <Card>
                <CardTitle>🚦 Явцын статус: {getStatusLabel(activeOrder.status)}</CardTitle>
                <StatusTimeline statuses={[]} currentStatus={activeOrder.status} />
              </Card>
              {activeOrder.status === 'arrived_dropoff' && (
                <Card>
                  <CardTitle>📸 Нотлох зураг</CardTitle>
                  <input type="file" accept="image/*" capture="camera"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    style={{ marginBottom: 8, fontSize: 13 }}
                  />
                  {proofFile && <div style={{ fontSize: 12, color: '#1D9E75', marginBottom: 8 }}>✓ {proofFile.name}</div>}
                </Card>
              )}
              {NEXT_STATUS[activeOrder.status] && (
                <Btn variant={activeOrder.status === 'arrived_dropoff' ? 'green' : 'blue'}
                  onClick={advanceStatus} disabled={uploading}>
                  {uploading ? 'Байршуулж байна...' : NEXT_STATUS[activeOrder.status]?.label}
                </Btn>
              )}
              {activeOrder.note && (
                <Alert variant="amber" style={{ marginTop: 8 }}>📝 {activeOrder.note}</Alert>
              )}
            </>
          )}
        </div>
      </>
    ),

    // ── 🛒 Дэлгүүр ────────────────────────────────────────────────────────
    shop: (
      <>
        <TopBar title="Жолоочийн дэлгүүр" subtitle="Сэлбэг, хэрэгсэл, хоол захиалах" color="#7C3AED" />
        <div style={{ padding: '14px 14px 0' }}>

          {/* Сагс */}
          {cart.length > 0 && (
            <Card style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <CardTitle style={{ margin: 0 }}>🛒 Сагс ({cart.length} бараа)</CardTitle>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{formatPrice(cartTotal)}</span>
              </div>
              {cart.map(c => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #EDE9FE' }}>
                  <span style={{ fontSize: 13 }}>{c.name} × {c.qty}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#7C3AED', fontWeight: 700 }}>{formatPrice(c.price * c.qty)}</span>
                    <button onClick={() => removeFromCart(c.name)}
                      style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                  </div>
                </div>
              ))}
              <FormInput label="Нэмэлт тэмдэглэл" placeholder="Хаяг, нэмэлт мэдэгдэл..."
                value={shopNote} onChange={e => setShopNote(e.target.value)} />
              <Btn onClick={handleShopOrder} disabled={shopLoading}
                style={{ background: '#7C3AED', marginTop: 4 }}>
                {shopLoading ? '⏳ Илгээж байна...' : '📦 Захиалга илгээх — ' + formatPrice(cartTotal)}
              </Btn>
            </Card>
          )}

          {/* Категори сонгох */}
          {!shopCat ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#374151' }}>Категори сонгоно уу:</div>
              {SHOP_CATEGORIES.map(cat => (
                <Card key={cat.id} onClick={() => setShopCat(cat.id)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 36 }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{cat.items.length} бараа байна</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 20, color: '#9CA3AF' }}>›</div>
                </Card>
              ))}

              {/* Өмнөх захиалгууд */}
              {shopOrders.length > 0 && (
                <Card style={{ marginTop: 4 }}>
                  <CardTitle>📋 Өмнөх захиалгууд</CardTitle>
                  {shopOrders.slice(0, 5).map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{o.items?.map(i => i.name).join(', ').slice(0, 30)}...</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{formatPrice(o.total)}</div>
                      </div>
                      <Badge variant={o.status === 'delivered' ? 'green' : o.status === 'cancelled' ? 'red' : 'amber'}>
                        {o.status === 'delivered' ? 'Хүргэгдсэн' : o.status === 'cancelled' ? 'Цуцлагдсан' : 'Боловсруулж байна'}
                      </Badge>
                    </div>
                  ))}
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Барааны жагсаалт */}
              <button onClick={() => setShopCat(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontWeight: 700, fontSize: 14, marginBottom: 10, fontFamily: 'inherit', padding: 0 }}>
                ← Буцах
              </button>
              {SHOP_CATEGORIES.find(c => c.id === shopCat)?.items.map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#7C3AED', fontWeight: 700 }}>{formatPrice(item.price)}</div>
                  </div>
                  <button onClick={() => addToCart(item)}
                    style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Нэмэх
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </>
    ),

    // ── 🆘 Тусламж ─────────────────────────────────────────────────────────
    help: (
      <>
        <TopBar title="Тусламж дуудах" subtitle="Яаралтай болон техникийн тусламж" color="#DC2626" />
        <div style={{ padding: '14px 14px 0' }}>

          {/* Яаралтай товчнууд */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <a href="tel:103" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>🏥</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>103 — Эмнэлэг</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Яаралтай дуудлага</div>
              </div>
            </a>
            <a href="tel:102" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#EFF6FF', border: '2px solid #93C5FD', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>👮</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>102 — Цагдаа</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Яаралтай дуудлага</div>
              </div>
            </a>
          </div>

          {/* Тусламжийн төрөл сонгох */}
          <Card>
            <CardTitle>🆘 Тусламжийн хүсэлт илгээх</CardTitle>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Тусламжийн төрлийг сонгоно уу:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {HELP_TYPES.filter(h => h.key !== 'medical' && h.key !== 'police').map(h => (
                <button key={h.key}
                  onClick={() => setHelpType(helpType?.key === h.key ? null : h)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: helpType?.key === h.key ? '2px solid #DC2626' : '1.5px solid #E5E7EB',
                    background: helpType?.key === h.key ? '#FEF2F2' : '#FAFAFA',
                    fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 24 }}>{h.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{h.label}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{h.desc}</div>
                  </div>
                  {helpType?.key === h.key && <span style={{ marginLeft: 'auto', color: '#DC2626', fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>

            {helpType && (
              <>
                <FormInput label="Байршил / Замын нэр (заавал биш)"
                  placeholder="Жнэ: Баянзүрх, Налайхын зам 5 км..."
                  value={helpLoc} onChange={e => setHelpLoc(e.target.value)} />
                <FormInput label="Нэмэлт тайлбар (заавал биш)"
                  placeholder="Машины марк, дугаар, нөхцөл байдал..."
                  value={helpNote} onChange={e => setHelpNote(e.target.value)} />
                <Btn onClick={handleSendHelp} disabled={helpLoading}
                  style={{ background: '#DC2626' }}>
                  {helpLoading ? '⏳ Илгээж байна...' : '🆘 Тусламж илгээх — ' + helpType.label}
                </Btn>
              </>
            )}
          </Card>

          {/* Өмнөх хүсэлтүүд */}
          {helpRequests.length > 0 && (
            <Card style={{ marginTop: 8 }}>
              <CardTitle>📋 Сүүлийн хүсэлтүүд</CardTitle>
              {helpRequests.slice(0, 3).map(r => (
                <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.typeLabel}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{r.location}</div>
                  <Badge variant={r.status === 'resolved' ? 'green' : 'amber'} style={{ marginTop: 4 }}>
                    {r.status === 'resolved' ? 'Шийдвэрлэгдсэн' : 'Хянагдаж байна'}
                  </Badge>
                </div>
              ))}
            </Card>
          )}
        </div>
      </>
    ),

    // ── Бүртгэл ───────────────────────────────────────────────────────────
    register: (
      <>
        <TopBar title="Жолоочийн бүртгэл" subtitle="Баталгаажуулалт" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          {driverProfile?.status === 'pending' && (
            <Alert variant="amber">⏳ Таны бүртгэл шалгагдаж байна. 24 цагийн дотор мэдэгдэнэ.</Alert>
          )}
          {driverProfile?.status === 'approved' && (
            <Alert variant="green">✅ Таны бүртгэл баталгаажсан!</Alert>
          )}
          {driverProfile?.status === 'rejected' && (
            <Alert variant="red">✕ Таны бүртгэл татгалзагдлаа. Дахин бөглөнө үү.</Alert>
          )}
          <Card>
            <CardTitle>👤 Хувийн мэдээлэл</CardTitle>
            <FormInput label="Бүтэн нэр" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="Овог Нэр" />
            <FormInput label="Утас" type="tel" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} placeholder="9911 0000" />
            <FormInput label="Регистрийн дугаар" value={regForm.idNumber} onChange={(e) => setRegForm({ ...regForm, idNumber: e.target.value })} placeholder="АА99123456" />
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Иргэний үнэмлэх / Жолооны үнэмлэх</label>
              <input type="file" accept="image/*" style={{ fontSize: 13 }} />
            </div>
          </Card>
          <Card>
            <CardTitle>🚛 Тээврийн хэрэгсэл</CardTitle>
            <FormSelect label="Тээврийн хэрэгслийн төрөл"
              value={regForm.vehicleType}
              onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
              options={Object.entries(VEHICLE_MULTIPLIERS).map(([k, v]) => ({ value: k, label: v.label }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FormInput label="Марк" value={regForm.vehicleBrand} onChange={(e) => setRegForm({ ...regForm, vehicleBrand: e.target.value })} placeholder="Toyota" />
              <FormInput label="Загвар" value={regForm.vehicleModel} onChange={(e) => setRegForm({ ...regForm, vehicleModel: e.target.value })} placeholder="Hilux" />
            </div>
            <FormInput label="Улсын дугаар" value={regForm.vehiclePlate} onChange={(e) => setRegForm({ ...regForm, vehiclePlate: e.target.value })} placeholder="УБ-1234АА" />
            <FormInput label="Даацын хэмжээ (кг)" type="number" value={regForm.vehicleCapacity} onChange={(e) => setRegForm({ ...regForm, vehicleCapacity: e.target.value })} placeholder="5000" />
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Машины зураг</label>
              <input type="file" accept="image/*" style={{ fontSize: 13 }} />
            </div>
          </Card>
          <Card>
            <CardTitle>🏦 Банкны мэдээлэл</CardTitle>
            <FormSelect label="Банк" value={regForm.bankName}
              onChange={(e) => setRegForm({ ...regForm, bankName: e.target.value })}
              options={['Хаан банк','Голомт банк','ТДБ банк','Хас банк','Богд банк'].map(b => ({ value: b, label: b }))} />
            <FormInput label="Дансны дугаар" value={regForm.bankAccount} onChange={(e) => setRegForm({ ...regForm, bankAccount: e.target.value })} placeholder="5043 1234 5678" />
            <FormInput label="Дансны эзний нэр" value={regForm.bankOwner} onChange={(e) => setRegForm({ ...regForm, bankOwner: e.target.value })} placeholder="Батхуяг Оюунбаяр" />
          </Card>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
            <input type="checkbox" id="d-agree" checked={legalOk} onChange={(e) => setLegalOk(e.target.checked)} style={{ marginTop: 2, accentColor: '#185FA5' }} />
            <label htmlFor="d-agree" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              🚫 Би хуулийн эсрэг барааг тээвэрлэхгүй. АчааЗам платформын үйлчилгээний нөхцлийг зөвшөөрч байна.
            </label>
          </div>
          <Btn variant="blue" onClick={handleRegister}>📤 Бүртгэл илгээх</Btn>
        </div>
      </>
    ),

    // ── Орлого ────────────────────────────────────────────────────────────
    earnings: (
      <>
        <TopBar title="Орлого" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Энэ сарын орлого', val: formatPrice(myOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price || 0) * 0.85, 0)), color: '#1D9E75' },
              { label: 'Нийт хүргэлт', val: myOrders.filter(o => o.status === 'completed').length, color: '#111' },
              { label: 'Дундаж үнэлгээ', val: (driverProfile?.rating || 0) + '★', color: '#BA7517' },
              { label: 'Цагтаа хүргэлт', val: (driverProfile?.onTimePercent || 0) + '%', color: '#185FA5' },
            ].map(s => (
              <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Card>
            <CardTitle>📊 Сүүлийн захиалгууд</CardTitle>
            {myOrders.slice(0, 10).map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>#{o.id?.slice(0, 8)} · {o.itemType}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{o.pickup?.address?.split(',')[0]} → {o.dropoff?.address?.split(',')[0]}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>+{formatPrice(Math.round((o.price || 0) * 0.85))}</div>
                  <Badge variant={o.status === 'completed' ? 'green' : 'amber'}>{getStatusLabel(o.status)}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </>
    ),

    // ── Профайл ───────────────────────────────────────────────────────────
    profile: (
      <>
        <TopBar title="Профайл" color="#185FA5" />
        <div style={{ padding: '14px 14px 0' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 auto 10px' }}>
              {driverProfile?.name?.[0] || '?'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{driverProfile?.name || userProfile?.name || 'Нэр байхгүй'}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>📱 {userProfile?.phone}</div>
            {driverProfile?.status === 'approved' && (
              <span style={{ display: 'inline-block', marginTop: 6, background: '#E1F5EE', color: '#0F6E56', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Баталгаажсан</span>
            )}
          </Card>
          <Card>
            <InfoRow label="Тээврийн хэрэгсэл" value={VEHICLE_MULTIPLIERS[driverProfile?.vehicleType]?.label || '—'} />
            <InfoRow label="Улсын дугаар" value={driverProfile?.vehiclePlate || '—'} />
            <InfoRow label="Даац" value={driverProfile?.vehicleCapacity ? driverProfile.vehicleCapacity + ' кг' : '—'} />
          </Card>
          <Btn variant="outline" style={{ color: '#E24B4A', borderColor: '#E24B4A' }} onClick={logout}>🚪 Гарах</Btn>
        </div>
      </>
    ),
  };

  return (
    <PageShell>
      {screen[tab] || screen.orders}
      <BottomNav
        color="#185FA5"
        active={tab}
        onSelect={setTab}
        items={[
          { key: 'orders',   icon: '📋', label: 'Захиалга' },
          { key: 'active',   icon: '🗺️', label: 'Идэвхтэй' },
          { key: 'shop',     icon: '🛒', label: 'Дэлгүүр'  },
          { key: 'help',     icon: '🆘', label: 'Тусламж'  },
          { key: 'register', icon: '🪪',  label: 'Бүртгэл'  },
          { key: 'earnings', icon: '💰', label: 'Орлого'   },
          { key: 'profile',  icon: '👤', label: 'Профайл'  },
        ]}
      />
    </PageShell>
  );
}
