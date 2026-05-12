// src/pages/admin/AdminPanel.jsx
import { useEffect, useState } from 'react';
import { listenAllOrders, listenAllDrivers, updateDriverStatus, updateOrderStatus, savePricingConfig, getPricingConfig } from '../../firebase/db';
import { Card, CardTitle, Btn, InfoRow, Badge, Alert } from '../../components/common/UI';
import DeliveryMap from '../../components/map/DeliveryMap';
import { formatPrice, getStatusLabel, DEFAULT_PRICING } from '../../utils/pricing';
import toast from 'react-hot-toast';
import { logout } from '../../firebase/auth';

const TABS = [
  { key: 'dashboard',  label: '📊 Самбар'   },
  { key: 'drivers',    label: '🪪 Жолооч'   },
  { key: 'orders',     label: '📦 Захиалга' },
  { key: 'live',       label: '🗺️ Бодит цаг'},
  { key: 'payment',    label: '💳 Төлбөр'   },
  { key: 'pricing',    label: '💰 Үнэ'      },
  { key: 'analytics',  label: '📈 Аналитик' },
];

export default function AdminPanel() {
  const [tab, setTab]         = useState('dashboard');
  const [orders, setOrders]   = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [dFilter, setDFilter] = useState('all');
  const [oFilter, setOFilter] = useState('all');

  useEffect(() => {
    const u1 = listenAllOrders(setOrders);
    const u2 = listenAllDrivers(setDrivers);
    getPricingConfig().then((cfg) => cfg && setPricing(cfg));
    return () => { u1(); u2(); };
  }, []);

  const stats = {
    totalDrivers:    drivers.length,
    pendingDrivers:  drivers.filter((d) => d.status === 'pending').length,
    todayOrders:     orders.length,
    activeOrders:    orders.filter((o) => !['completed', 'cancelled', 'pending'].includes(o.status)).length,
    revenue:         orders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.price || 0), 0),
    commission:      orders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.price || 0) * (pricing.commissionPct / 100), 0),
  };

  const filteredDrivers = dFilter === 'all' ? drivers : drivers.filter((d) => d.status === dFilter);
  const filteredOrders  = oFilter === 'all' ? orders  : orders.filter((o) => o.status === oFilter);

  async function handleApproveDriver(driverId, status) {
    await updateDriverStatus(driverId, status);
    toast.success(status === 'approved' ? 'Жолооч баталгаажлаа ✅' : 'Жолооч татгалзагдлаа');
  }

  async function handleReleasePayment(order) {
    await updateOrderStatus(order.id, 'completed', { paymentStatus: 'released' });
    toast.success('Төлбөр шилжүүлэгдлээ');
  }

  async function handleSavePricing() {
    await savePricingConfig(pricing);
    toast.success('Үнийн тохиргоо хадгалагдлаа');
  }

  const driverBadge = (status) => {
    const map = { pending: 'amber', approved: 'green', rejected: 'red', suspended: 'red' };
    const labels = { pending: 'Хүлээгдэж байна', approved: 'Баталгаажсан', rejected: 'Татгалзагдсан', suspended: 'Зогсоосон' };
    return <Badge variant={map[status] || 'amber'}>{labels[status] || status}</Badge>;
  };

  const orderBadge = (status) => {
    const map = { pending: 'amber', accepted: 'blue', completed: 'green', cancelled: 'red' };
    return <Badge variant={map[status] || 'amber'}>{getStatusLabel(status)}</Badge>;
  };

  const screens = {
    dashboard: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Нийт жолооч',       val: stats.totalDrivers,           color: '#111'    },
            { label: 'Хүлээгдэж байна',   val: stats.pendingDrivers,         color: '#BA7517' },
            { label: 'Нийт захиалга',     val: stats.todayOrders,            color: '#1D9E75' },
            { label: 'Идэвхтэй хүргэлт', val: stats.activeOrders,           color: '#185FA5' },
            { label: 'Нийт орлого',       val: formatPrice(stats.revenue),   color: '#533AB7' },
            { label: 'Комисс',            val: formatPrice(stats.commission), color: '#E24B4A' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {stats.pendingDrivers > 0 && (
          <Alert variant="amber">
            ⚠️ {stats.pendingDrivers} жолоочийн бүртгэл баталгаажуулалт хүлээж байна →{' '}
            <span style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => setTab('drivers')}>Шалгах</span>
          </Alert>
        )}

        <Card>
          <CardTitle>⚡ Сүүлийн захиалгууд</CardTitle>
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600 }}>#{o.id?.slice(0, 8)}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{o.pickup?.address?.split(',')[0]} → {o.dropoff?.address?.split(',')[0]}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {orderBadge(o.status)}
                <span style={{ fontWeight: 700, color: '#1D9E75' }}>{formatPrice(o.price || 0)}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    ),

    drivers: (
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map((f) => (
            <button key={f} onClick={() => setDFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit',
              background: dFilter === f ? '#533AB7' : '#fff',
              color: dFilter === f ? '#fff' : '#374151',
            }}>
              {f === 'all' ? 'Бүгд' : f === 'pending' ? `Хүлээгдэж байна (${drivers.filter((d) => d.status === 'pending').length})` : f === 'approved' ? 'Баталгаажсан' : f === 'rejected' ? 'Татгалзсан' : 'Зогсоосон'}
            </button>
          ))}
        </div>

        {filteredDrivers.map((d) => (
          <Card key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  {d.name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name || 'Нэр байхгүй'}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{d.vehicleType} · {d.vehiclePlate}</div>
                </div>
              </div>
              {driverBadge(d.status)}
            </div>
            <InfoRow label="Утас" value={d.phone || '—'} />
            <InfoRow label="Регистр" value={d.idNumber || '—'} />
            <InfoRow label="Банк" value={d.bankName ? `${d.bankName} · ${d.bankAccount}` : '—'} />
            <InfoRow label="Үнэлгээ" value={`${d.rating || 0}★ (${d.totalDeliveries || 0} хүргэлт)`} />
            {d.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => handleApproveDriver(d.id, 'rejected')} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Татгалзах</button>
                <button onClick={() => handleApproveDriver(d.id, 'approved')} style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: '#1D9E75', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>✓ Баталгаажуулах</button>
              </div>
            )}
            {d.status === 'approved' && (
              <button onClick={() => handleApproveDriver(d.id, 'suspended')} style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1px solid #FAEEDA', background: '#FAEEDA', color: '#854F0B', cursor: 'pointer', fontFamily: 'inherit' }}>⏸️ Түр зогсоох</button>
            )}
          </Card>
        ))}
      </div>
    ),

    orders: (
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((f) => (
            <button key={f} onClick={() => setOFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit',
              background: oFilter === f ? '#533AB7' : '#fff',
              color: oFilter === f ? '#fff' : '#374151',
            }}>
              {f === 'all' ? 'Бүгд' : getStatusLabel(f)}
            </button>
          ))}
        </div>
        {filteredOrders.map((o) => (
          <Card key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>#{o.id?.slice(0, 10)}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{o.itemType} · {o.weight} кг</div>
              </div>
              {orderBadge(o.status)}
            </div>
            <InfoRow label="Авах байршил" value={o.pickup?.address} />
            <InfoRow label="Хүргэх байршил" value={o.dropoff?.address} />
            <InfoRow label="Жолооч" value={o.driverName || '—'} />
            <InfoRow label="Дүн" value={formatPrice(o.price || 0)} valueStyle={{ color: '#1D9E75' }} />
            <InfoRow label="Төлбөр" value={o.paymentStatus === 'released' ? '✅ Шилжсэн' : '⏳ Хүлээгдэж байна'} />
            {o.proofPhotoUrl && (
              <a href={o.proofPhotoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#185FA5', display: 'block', marginTop: 6 }}>📷 Нотлох зураг харах →</a>
            )}
            {o.status === 'completed' && o.paymentStatus !== 'released' && (
              <button onClick={() => handleReleasePayment(o)} style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: '#E1F5EE', color: '#0F6E56', cursor: 'pointer', fontFamily: 'inherit' }}>💳 Төлбөр шилжүүлэх</button>
            )}
          </Card>
        ))}
      </div>
    ),

    live: (
      <div>
        <Card>
          <CardTitle>🗺️ Бодит цагийн хяналт — {stats.activeOrders} хүргэлт явж байна</CardTitle>
          <DeliveryMap
            pickup={{ lat: 47.9184, lng: 106.9177, label: 'Улаанбаатар' }}
            height={280}
          />
        </Card>
        <Card>
          <CardTitle>📍 Идэвхтэй хүргэлтүүд</CardTitle>
          {orders.filter((o) => !['completed', 'cancelled', 'pending'].includes(o.status)).map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>#{o.id?.slice(0, 8)} · {o.driverName || '—'}</div>
                <div style={{ color: '#6B7280' }}>{o.pickup?.address?.split(',')[0]} → {o.dropoff?.address?.split(',')[0]}</div>
              </div>
              {orderBadge(o.status)}
            </div>
          ))}
          {stats.activeOrders === 0 && <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF' }}>Идэвхтэй хүргэлт байхгүй</div>}
        </Card>
      </div>
    ),

    payment: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Нийт орлого',  val: formatPrice(stats.revenue),    color: '#1D9E75' },
            { label: 'Комисс',       val: formatPrice(stats.commission),  color: '#533AB7' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardTitle>⏳ Хүлээгдэж буй төлбөрүүд</CardTitle>
          {orders.filter((o) => o.status === 'completed' && o.paymentStatus !== 'released').map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>#{o.id?.slice(0, 8)} — {o.driverName}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{formatPrice(o.price || 0)}</div>
              </div>
              <button onClick={() => handleReleasePayment(o)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', background: '#E1F5EE', color: '#0F6E56', cursor: 'pointer', fontFamily: 'inherit' }}>Шилжүүлэх</button>
            </div>
          ))}
          {orders.filter((o) => o.status === 'completed' && o.paymentStatus !== 'released').length === 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF' }}>Хүлээгдэж буй төлбөр байхгүй</div>
          )}
        </Card>
      </div>
    ),

    pricing: (
      <div>
        <Card>
          <CardTitle>💰 Үнийн тохиргоо</CardTitle>
          {[
            { key: 'baseFare',     label: 'Суурь үнэ (₮)' },
            { key: 'perKm',        label: 'Км тутмын үнэ (₮)' },
            { key: 'loadingHelp',  label: 'Ачих/буулгах тусламж (₮)' },
            { key: 'urgentExtra',  label: 'Яаралтай нэмэлт (₮)' },
            { key: 'nightExtra',   label: 'Шөнийн нэмэлт (₮)' },
            { key: 'commissionPct', label: 'Платформын комисс (%)' },
          ].map((f) => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <label style={{ fontSize: 13, flex: 1, color: '#374151' }}>{f.label}</label>
              <input
                type="number"
                value={pricing[f.key]}
                onChange={(e) => setPricing({ ...pricing, [f.key]: Number(e.target.value) })}
                style={{ width: 100, padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }}
              />
            </div>
          ))}
        </Card>
        <Btn variant="purple" onClick={handleSavePricing}>💾 Тохиргоо хадгалах</Btn>
      </div>
    ),

    analytics: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Нийт захиалга',   val: orders.length },
            { label: 'Дууссан',          val: orders.filter((o) => o.status === 'completed').length },
            { label: 'Нийт орлого',     val: formatPrice(stats.revenue), color: '#1D9E75' },
            { label: 'Жолоочийн тоо',   val: drivers.filter((d) => d.status === 'approved').length },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color || '#111' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <Card>
          <CardTitle>📦 Ачааны төрлийн хуваарилалт</CardTitle>
          {['furniture', 'construction', 'appliance', 'boxes', 'equipment', 'other'].map((t) => {
            const cnt = orders.filter((o) => o.itemType === t).length;
            const pct = orders.length ? Math.round(cnt / orders.length * 100) : 0;
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, flex: 1, color: '#374151' }}>{t}</span>
                <div style={{ width: 100, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#1D9E75' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 30 }}>{pct}%</span>
              </div>
            );
          })}
        </Card>
      </div>
    ),
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', minHeight: '100vh', background: '#F4F5F7' }}>
      {/* Admin Top bar */}
      <div style={{ background: '#533AB7', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🚛 АчааЗам Админ</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Платформын удирдлагын самбар</div>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Гарах</button>
      </div>

      {/* Admin tab nav */}
      <div style={{ background: '#fff', display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            border: 'none', borderBottom: tab === t.key ? '2px solid #533AB7' : '2px solid transparent',
            background: 'none', color: tab === t.key ? '#533AB7' : '#6B7280',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {screens[tab] || screens.dashboard}
      </div>
    </div>
  );
}
