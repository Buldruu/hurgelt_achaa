export const VEHICLE_MULTIPLIERS = {
  pickup:       { label: 'Пикап',        mult: 1.0, maxTon: 1.5, icon: '🛻' },
  van:          { label: 'Ван',          mult: 1.2, maxTon: 2,   icon: '🚐' },
  porter:       { label: 'Портер',       mult: 1.4, maxTon: 3,   icon: '🚚' },
  small_cargo:  { label: 'Жижиг ачааны', mult: 1.6, maxTon: 5,   icon: '🚛' },
  medium_cargo: { label: 'Дунд ачааны',  mult: 1.8, maxTon: 8,   icon: '🚛' },
  large_cargo:  { label: 'Том ачааны',   mult: 2.0, maxTon: 15,  icon: '🚛' },
};

export const DEFAULT_PRICING = {
  baseFare: 5000, perKm: 2500, loadingHelp: 15000,
  urgentExtra: 20000, nightExtra: 10000, commissionPct: 15,
};

export function calcPrice(distKm, vehicleType, options = {}, config = DEFAULT_PRICING) {
  const mult = VEHICLE_MULTIPLIERS[vehicleType]?.mult || 1;
  let price = (config.baseFare + distKm * config.perKm) * mult;
  if (options.loadingHelp) price += config.loadingHelp;
  if (options.urgent)      price += config.urgentExtra;
  if (options.night)       price += config.nightExtra;
  return Math.round(price / 1000) * 1000;
}

export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function formatPrice(n) {
  return '₮' + (n||0).toLocaleString();
}

export function getStatusLabel(key) {
  const map = {
    pending: 'Захиалга үүслээ', accepted: 'Жолооч авлаа',
    going_pickup: 'Авах байршил руу', arrived_pickup: 'Авах байршилд ирлээ',
    picked_up: 'Ачилт хийлээ', going_dropoff: 'Хүргэх байршил руу',
    arrived_dropoff: 'Хүргэх байршилд ирлээ', completed: 'Дууслаа ✅',
    cancelled: 'Цуцлагдсан',
  };
  return map[key] || key;
}

export const UB_LOCATIONS = [
  { label: 'Сүхбаатар, 1-р хороо',    lat: 47.9138, lng: 106.9165 },
  { label: 'Баянзүрх, 5-р хороо',     lat: 47.9225, lng: 106.9600 },
  { label: 'Хан-Уул, 8-р хороо',      lat: 47.8871, lng: 106.9052 },
  { label: 'Чингэлтэй, 2-р хороо',    lat: 47.9260, lng: 106.9050 },
  { label: 'Сонгинохайрхан, 18-р хороо', lat: 47.9350, lng: 106.8200 },
  { label: 'Налайх дүүрэг',            lat: 47.7500, lng: 107.2400 },
  { label: 'Багануур дүүрэг',          lat: 47.7100, lng: 108.2800 },
  { label: 'Баянгол, 20-р хороо',      lat: 47.9000, lng: 106.8700 },
];
