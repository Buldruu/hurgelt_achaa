// src/firebase/db.js
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  GeoPoint, limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export async function createOrder(orderData) {
  return addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function updateOrderStatus(orderId, status, extra = {}) {
  return updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
    ...extra,
  });
}

export function listenOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export function listenAvailableOrders(vehicleType, callback) {
  const q = query(
    collection(db, 'orders'),
    where('status', '==', 'pending'),
    where('vehicleType', '==', vehicleType),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenCustomerOrders(customerId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenDriverOrders(driverId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── DRIVER LOCATION ─────────────────────────────────────────────────────────

export async function updateDriverLocation(driverId, lat, lng) {
  return updateDoc(doc(db, 'drivers', driverId), {
    location: new GeoPoint(lat, lng),
    locationUpdatedAt: serverTimestamp(),
  });
}

export function listenDriverLocation(driverId, callback) {
  return onSnapshot(doc(db, 'drivers', driverId), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

export async function createDriverProfile(uid, data) {
  return updateDoc(doc(db, 'drivers', uid), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    rating: 0,
    totalDeliveries: 0,
    onTimePercent: 0,
  }).catch(() =>
    // doc doesn't exist yet
    import('firebase/firestore').then(({ setDoc }) =>
      setDoc(doc(db, 'drivers', uid), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
        rating: 0,
        totalDeliveries: 0,
        onTimePercent: 0,
      })
    )
  );
}

export async function getDriverProfile(uid) {
  const snap = await getDoc(doc(db, 'drivers', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenAllDrivers(callback) {
  return onSnapshot(collection(db, 'drivers'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateDriverStatus(driverId, status) {
  return updateDoc(doc(db, 'drivers', driverId), { status });
}

// ─── UPLOAD ──────────────────────────────────────────────────────────────────

export async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ─── RATINGS ─────────────────────────────────────────────────────────────────

export async function submitRating(orderId, raterId, targetId, targetType, data) {
  await addDoc(collection(db, 'ratings'), {
    orderId,
    raterId,
    targetId,
    targetType, // 'driver' | 'customer'
    ...data,
    createdAt: serverTimestamp(),
  });
  // Update driver average rating
  if (targetType === 'driver') {
    const q = query(collection(db, 'ratings'), where('targetId', '==', targetId));
    const snap = await getDocs(q);
    const ratings = snap.docs.map((d) => d.data().stars);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, 'drivers', targetId), {
      rating: Math.round(avg * 10) / 10,
      totalRatings: ratings.length,
    });
  }
}

export function listenRatings(targetId, callback) {
  const q = query(
    collection(db, 'ratings'),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── AGREEMENTS ──────────────────────────────────────────────────────────────

export async function saveAgreement(userId, role, deviceInfo) {
  return addDoc(collection(db, 'agreements'), {
    userId,
    role,
    agreedAt: serverTimestamp(),
    deviceInfo,
  });
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export function listenAllOrders(callback) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getPricingConfig() {
  const snap = await getDoc(doc(db, 'config', 'pricing'));
  return snap.exists() ? snap.data() : null;
}

export async function savePricingConfig(data) {
  const { setDoc } = await import('firebase/firestore');
  return setDoc(doc(db, 'config', 'pricing'), { ...data, updatedAt: serverTimestamp() });
}
