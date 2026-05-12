// src/utils/pricing.js

export const VEHICLE_MULTIPLIERS = {
  pickup:       { label: 'Пикап 🛻',           mult: 1.0, maxTon: 1.5 },
  van:          { label: 'Ван 🚐',              mult: 1.2, maxTon: 2   },
  porter:       { label: 'Портер 🚚',           mult: 1.4, maxTon: 3   },
  small_cargo:  { label: 'Жижиг ачааны 🚛',     mult: 1.6, maxTon: 5   },
  medium_cargo: { label: 'Дунд ачааны 🚛',      mult: 1.8, maxTon: 8   },
  large_cargo:  { label: 'Том ачааны 🚛',       mult: 2.0, maxTon: 15  },
};

export const DEFAULT_PRICING = {
  baseFare:        5000,   // ₮
  perKm:           2500,   // ₮ per km
  loadingHelp:     15000,
  urgentExtra:     20000,
  nightExtra:      10000,
  commissionPct:   15,
};

export function calcPrice(distanceKm, vehicleType, options = {}, config = DEFAULT_PRICING) {
  const mult = VEHICLE_MULTIPLIERS[vehicleType]?.mult || 1;
  let price = (config.baseFare + distanceKm * config.perKm) * mult;
  if (options.loadingHelp) price += config.loadingHelp;
  if (options.urgent)      price += config.urgentExtra;
  if (options.night)       price += config.nightExtra;
  return Math.round(price / 1000) * 1000; // round to nearest 1000
}

export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatPrice(n) {
  return '₮' + n.toLocaleString('mn-MN');
}

export const ORDER_STATUSES = [
  { key: 'pending',          label: 'Захиалга үүслээ',                    color: '#BA7517' },
  { key: 'accepted',         label: 'Жолооч захиалга авлаа',              color: '#185FA5' },
  { key: 'going_pickup',     label: 'Авах байршил руу явж байна',         color: '#185FA5' },
  { key: 'arrived_pickup',   label: 'Авах байршилд ирлээ',               color: '#185FA5' },
  { key: 'picked_up',        label: 'Ачилт хийлээ',                      color: '#533AB7' },
  { key: 'going_dropoff',    label: 'Хүргэх байршил руу явж байна',       color: '#533AB7' },
  { key: 'arrived_dropoff',  label: 'Хүргэх байршилд ирлээ',            color: '#1D9E75' },
  { key: 'completed',        label: 'Хүргэлт дууслаа ✅',                color: '#1D9E75' },
];

export function getStatusLabel(key) {
  return ORDER_STATUSES.find((s) => s.key === key)?.label || key;
}
