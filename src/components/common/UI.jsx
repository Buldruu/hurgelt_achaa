// src/components/common/UI.jsx
/* eslint-disable react-refresh/only-export-components */

export const C = {
  green: '#1D9E75', greenDark: '#0F6E56', greenLight: '#ECFDF5',
  blue: '#1A6FC4', blueLight: '#EFF6FF',
  purple: '#5B3FD4', purpleLight: '#F5F3FF',
  red: '#E03E3E', redLight: '#FEF2F2',
  amber: '#D97706', amberLight: '#FFFBEB',
  bg: '#F0F2F5', card: '#FFFFFF',
  border: '#E5E7EB', text: '#111827', textMuted: '#6B7280', textFaint: '#9CA3AF',
};

const BTN = {
  green:   { bg: '#1D9E75', color: '#fff', shadow: '0 4px 14px rgba(29,158,117,0.4)' },
  blue:    { bg: '#1A6FC4', color: '#fff', shadow: '0 4px 14px rgba(26,111,196,0.4)' },
  purple:  { bg: '#5B3FD4', color: '#fff', shadow: '0 4px 14px rgba(91,63,212,0.35)' },
  red:     { bg: '#E03E3E', color: '#fff', shadow: '0 4px 14px rgba(224,62,62,0.35)' },
  amber:   { bg: '#D97706', color: '#fff', shadow: '0 4px 14px rgba(217,119,6,0.35)' },
  outline: { bg: '#fff', color: '#374151', shadow: 'none', border: '1.5px solid #E5E7EB' },
  ghost:   { bg: 'rgba(0,0,0,0.05)', color: '#374151', shadow: 'none' },
};

export function Btn({ children, variant = 'green', onClick, disabled, style = {}, sm }) {
  const v = BTN[variant] || BTN.green;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: sm ? '10px 14px' : '14px 16px',
      background: v.bg, color: v.color, border: v.border || 'none',
      borderRadius: 14, fontSize: sm ? 13 : 15, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontFamily: 'inherit', boxShadow: disabled ? 'none' : v.shadow,
      transition: 'all 0.15s', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, marginTop: sm ? 0 : 8,
      letterSpacing: '-0.01em', ...style,
    }}>
      {children}
    </button>
  );
}

export function BtnRow({ children }) {
  return <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{children}</div>;
}

export function BtnHalf({ children, variant = 'outline', onClick, style = {} }) {
  const v = BTN[variant] || BTN.outline;
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '11px 8px', background: v.bg, color: v.color,
      border: v.border || 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', boxShadow: v.shadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      ...style,
    }}>
      {children}
    </button>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid #F0F0F2', borderRadius: 16,
      padding: '14px 16px', marginBottom: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, style = {} }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#A0A8B4',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, ...style,
    }}>
      {children}
    </div>
  );
}

export function InfoRow({ label, value, valueStyle = {}, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '9px 0', borderBottom: last ? 'none' : '1px solid #F5F5F7',
      fontSize: 13, gap: 12,
    }}>
      <span style={{ color: '#6B7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', color: '#111827', ...valueStyle }}>{value}</span>
    </div>
  );
}

const BDGMAP = {
  green:  { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
  amber:  { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  blue:   { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  red:    { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  purple: { bg: '#F5F3FF', color: '#7C3AED', dot: '#8B5CF6' },
  gray:   { bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
};

export function Badge({ children, variant = 'green', dot }) {
  const s = BDGMAP[variant] || BDGMAP.green;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, padding: '3px 9px', borderRadius: 20,
      fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

export function FormInput({ label, hint, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>}
      <input style={{
        width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB',
        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
        background: '#FAFAFA', color: '#111827',
      }}
      onFocus={e => { e.target.style.borderColor = '#1D9E75'; e.target.style.background = '#fff'; }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; }}
      {...props} />
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function FormSelect({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>}
      <select style={{
        width: '100%', padding: '11px 36px 11px 14px', border: '1.5px solid #E5E7EB',
        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
        background: '#FAFAFA', color: '#111827', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function FormTextarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>}
      <textarea style={{
        width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB',
        borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none',
        background: '#FAFAFA', color: '#111827', resize: 'vertical',
      }}
      onFocus={e => { e.target.style.borderColor = '#1D9E75'; e.target.style.background = '#fff'; }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; }}
      {...props} />
    </div>
  );
}

export function Alert({ children, variant = 'amber', style = {} }) {
  const s = BDGMAP[variant] || BDGMAP.amber;
  return (
    <div style={{
      background: s.bg, color: s.color, borderRadius: 12,
      padding: '10px 14px', fontSize: 13, marginBottom: 10, lineHeight: 1.5,
      border: `1px solid ${s.color}22`, ...style,
    }}>
      {children}
    </div>
  );
}

export function CheckRow({ id, checked, onChange, children, accent = '#1D9E75' }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange}
        style={{ marginTop: 2, width: 16, height: 16, accentColor: accent, flexShrink: 0, cursor: 'pointer' }} />
      <label htmlFor={id} style={{ fontSize: 13, lineHeight: 1.55, cursor: 'pointer', color: '#374151' }}>
        {children}
      </label>
    </div>
  );
}

export function Spinner({ color = '#1D9E75', size = 32 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${color}22`, borderTop: `3px solid ${color}`,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export function PriceBox({ label, sub, price, color = '#1D9E75' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      borderRadius: 14, padding: '14px 16px', marginBottom: 10,
      border: `1.5px solid ${color}28`,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: color, marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: `${color}AA` }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color, letterSpacing: '-0.02em' }}>{price}</div>
    </div>
  );
}

export function TopBar({ title, subtitle, color = '#1D9E75', right }) {
  return (
    <div style={{ background: color, padding: '16px 16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

export function BottomNav({ items, active, onSelect, color = '#1D9E75' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: '#fff',
      borderTop: '1px solid #EFEFEF', display: 'flex', alignItems: 'center',
      zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    }}>
      {items.map(item => {
        const on = active === item.key;
        return (
          <button key={item.key} onClick={() => onSelect(item.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, fontSize: 10, fontWeight: 700, border: 'none', background: 'none',
            cursor: 'pointer', padding: '10px 0 12px', fontFamily: 'inherit',
            color: on ? color : '#C4C9D4', transition: 'color 0.15s', position: 'relative',
          }}>
            {item.notif && (
              <span style={{
                position: 'absolute', top: 8, left: '55%',
                width: 7, height: 7, background: '#EF4444',
                borderRadius: '50%', border: '1.5px solid #fff',
              }} />
            )}
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
            {on && <span style={{
              position: 'absolute', bottom: 0, width: 24, height: 3,
              background: color, borderRadius: '3px 3px 0 0',
            }} />}
          </button>
        );
      })}
    </div>
  );
}

export function PageShell({ children }) {
  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: '#F0F2F5', paddingBottom: 72,
    }}>
      {children}
    </div>
  );
}

export function StarRating({ value, onChange, size = 32 }) {
  return (
    <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange?.(n)} style={{
          fontSize: size, cursor: onChange ? 'pointer' : 'default',
          color: n <= value ? '#F59E0B' : '#E5E7EB',
          userSelect: 'none', transition: 'color 0.1s',
        }}>★</span>
      ))}
    </div>
  );
}

export const ORDER_STATUSES = [
  { key: 'pending',         label: 'Захиалга үүслээ' },
  { key: 'accepted',        label: 'Жолооч захиалга авлаа' },
  { key: 'going_pickup',    label: 'Авах байршил руу явж байна' },
  { key: 'arrived_pickup',  label: 'Авах байршилд ирлээ' },
  { key: 'picked_up',       label: 'Ачилт хийлээ' },
  { key: 'going_dropoff',   label: 'Хүргэх байршил руу явж байна' },
  { key: 'arrived_dropoff', label: 'Хүргэх байршилд ирлээ' },
  { key: 'completed',       label: 'Хүргэлт дууслаа ✅' },
];

export function StatusTimeline({ currentStatus }) {
  const idx = ORDER_STATUSES.findIndex(s => s.key === currentStatus);
  return (
    <div>
      {ORDER_STATUSES.map((s, i) => {
        const done = i < idx, active = i === idx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                background: done ? '#1D9E75' : active ? '#1A6FC4' : '#F3F4F6',
                color: done || active ? '#fff' : '#D1D5DB',
                boxShadow: active ? '0 0 0 4px rgba(26,111,196,0.18)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {i < ORDER_STATUSES.length - 1 && (
                <div style={{ width: 2, height: 20, marginTop: 3, background: done ? '#1D9E75' : '#EEEEEE' }} />
              )}
            </div>
            <div style={{ paddingTop: 3, paddingBottom: 18 }}>
              <div style={{
                fontSize: 13, fontWeight: active ? 700 : done ? 500 : 400,
                color: active ? '#1A6FC4' : done ? '#374151' : '#C4C9D4',
              }}>
                {s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VehicleGrid({ options, value, onChange }) {
  const icons = { pickup:'🛻', van:'🚐', porter:'🚚', small_cargo:'🚛', medium_cargo:'🚛', large_cargo:'🚛' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {options.map(opt => {
        const sel = value === opt.value;
        return (
          <div key={opt.value} onClick={() => onChange(opt.value)} style={{
            border: sel ? '2px solid #1D9E75' : '1.5px solid #EBEBEB',
            background: sel ? '#ECFDF5' : '#FAFAFA',
            borderRadius: 12, padding: '12px 10px', cursor: 'pointer',
            textAlign: 'center', transition: 'all 0.15s',
            boxShadow: sel ? '0 0 0 3px rgba(29,158,117,0.1)' : 'none',
          }}>
            <div style={{ fontSize: 26, marginBottom: 5 }}>{icons[opt.value] || '🚛'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#0F6E56' : '#374151' }}>{opt.label}</div>
            {opt.cap && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.cap}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function PaymentGrid({ options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {options.map(opt => {
        const sel = value === opt.value;
        return (
          <div key={opt.value} onClick={() => onChange(opt.value)} style={{
            border: sel ? '2px solid #1D9E75' : '1.5px solid #EBEBEB',
            background: sel ? '#ECFDF5' : '#FAFAFA',
            borderRadius: 12, padding: '12px 10px', cursor: 'pointer',
            textAlign: 'center', transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#0F6E56' : '#374151' }}>{opt.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function DriverCard({ name, sub, rating, deliveries, color = '#1A6FC4', actions }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#F8FAFF', borderRadius: 14, padding: '12px 14px',
      marginBottom: 10, border: '1px solid #E8EEFF',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
        boxShadow: `0 4px 10px ${color}40`,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 3 }}>{sub}</div>
        {rating !== undefined && (
          <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>
            {'★'.repeat(Math.round(rating || 5))}
            <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 4 }}>{rating} · {deliveries} хүргэлт</span>
          </div>
        )}
      </div>
      {actions && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

export function IconBtn({ children, color = '#1D9E75', bg, onClick, href }) {
  const s = {
    width: 38, height: 38, borderRadius: 10, background: bg || `${color}18`,
    border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 17,
    color, fontFamily: 'inherit', textDecoration: 'none',
  };
  return href ? <a href={href} style={s}>{children}</a> : <button onClick={onClick} style={s}>{children}</button>;
}

export function EmptyState({ icon = '📭', title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF' }}>
      <div style={{ fontSize: 48, marginBottom: 10 }}>{icon}</div>
      {title && <div style={{ fontSize: 15, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>{title}</div>}
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

export function UploadBox({ label, hint, onChange, file }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>{label}</div>}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `2px dashed ${file ? '#1D9E75' : '#D1D5DB'}`,
        background: file ? '#ECFDF5' : '#FAFAFA',
        borderRadius: 14, padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <input type="file" accept="image/*" capture="camera" onChange={onChange} style={{ display: 'none' }} />
        <div style={{ fontSize: 32, marginBottom: 6 }}>{file ? '✅' : '📷'}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: file ? '#0F6E56' : '#6B7280' }}>
          {file ? file.name : 'Зураг байршуулах'}
        </div>
        {hint && !file && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
      </label>
    </div>
  );
}

export function StatCard({ value, label, color = '#111827', icon, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px',
      border: '1px solid #F0F0F2', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export function TagGrid({ tags, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
      {tags.map(t => {
        const on = selected.includes(t);
        return (
          <button key={t} onClick={() => onToggle(t)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: `1.5px solid ${on ? '#1D9E75' : '#E5E7EB'}`,
            background: on ? '#1D9E75' : '#FAFAFA',
            color: on ? '#fff' : '#6B7280', fontFamily: 'inherit', fontWeight: 600,
            transition: 'all 0.15s',
          }}>{t}</button>
        );
      })}
    </div>
  );
}

export function SectionHeader({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{children}</div>
      {action}
    </div>
  );
}
