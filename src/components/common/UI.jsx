// src/components/common/UI.jsx
import React from 'react';

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'green', onClick, disabled, className = '', style = {} }) {
  const colors = {
    green:  { bg: '#1D9E75', color: '#fff' },
    blue:   { bg: '#185FA5', color: '#fff' },
    purple: { bg: '#533AB7', color: '#fff' },
    red:    { bg: '#E24B4A', color: '#fff' },
    amber:  { bg: '#BA7517', color: '#fff' },
    outline:{ bg: '#fff', color: '#374151', border: '1px solid rgba(0,0,0,0.15)' },
  };
  const c = colors[variant] || colors.green;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        width: '100%', padding: '13px', border: c.border || 'none',
        borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', transition: 'opacity .15s',
        ...c, ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 14, padding: '12px 14px', marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style,
    }}>
      {children}
    </div>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, valueStyle = {} }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 13,
    }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ fontWeight: 600, ...valueStyle }}>{value}</span>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  { bg: '#E1F5EE', color: '#0F6E56' },
  amber:  { bg: '#FAEEDA', color: '#854F0B' },
  blue:   { bg: '#E6F1FB', color: '#185FA5' },
  red:    { bg: '#FCEBEB', color: '#A32D2D' },
  purple: { bg: '#EEEDFE', color: '#533AB7' },
};

export function Badge({ children, variant = 'green' }) {
  const s = BADGE_STYLES[variant] || BADGE_STYLES.green;
  return (
    <span style={{
      fontSize: 11, padding: '3px 9px', borderRadius: 20,
      fontWeight: 700, background: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ── FormInput ─────────────────────────────────────────────────────────────────
export function FormInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', padding: '10px 12px',
          border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
          background: '#fff', color: '#111827',
        }}
        {...props}
      />
    </div>
  );
}

// ── FormSelect ────────────────────────────────────────────────────────────────
export function FormSelect({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', padding: '10px 12px',
          border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
          background: '#fff', color: '#111827',
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ children, variant = 'amber' }) {
  const s = BADGE_STYLES[variant] || BADGE_STYLES.amber;
  return (
    <div style={{
      background: s.bg, color: s.color, borderRadius: 10,
      padding: '10px 13px', fontSize: 13, marginBottom: 10,
      border: `1px solid ${s.color}33`,
    }}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ color = '#1D9E75' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid ${color}33`,
        borderTop: `3px solid ${color}`,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────────────
export function PageShell({ children, style = {} }) {
  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: '#F4F5F7', paddingBottom: 70, ...style,
    }}>
      {children}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar({ title, subtitle, color = '#1D9E75' }) {
  return (
    <div style={{ background: color, color: '#fff', padding: '14px 16px 18px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.85 }}>{subtitle}</div>}
    </div>
  );
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
export function BottomNav({ items, active, onSelect, color = '#1D9E75' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, height: 60,
      background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', zIndex: 100,
    }}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, fontSize: 10, fontWeight: 600, border: 'none', background: 'none',
            cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit',
            color: active === item.key ? color : '#9CA3AF',
          }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{
            fontSize: 32, cursor: onChange ? 'pointer' : 'default',
            color: n <= value ? '#BA7517' : '#E5E7EB',
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  );
}

// ── StatusTimeline ────────────────────────────────────────────────────────────
export function StatusTimeline({ statuses, currentStatus }) {
  const { ORDER_STATUSES } = require('../../utils/pricing');
  const currentIdx = ORDER_STATUSES.findIndex((s) => s.key === currentStatus);
  return (
    <div>
      {ORDER_STATUSES.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: done ? '#1D9E75' : active ? '#185FA5' : '#F3F4F6',
                color: done || active ? '#fff' : '#9CA3AF',
                border: active ? '2px solid #185FA5' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {i < ORDER_STATUSES.length - 1 && (
                <div style={{ width: 2, height: 20, background: done ? '#1D9E75' : '#E5E7EB', marginTop: 2 }} />
              )}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: done ? '#374151' : active ? '#185FA5' : '#9CA3AF',
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
