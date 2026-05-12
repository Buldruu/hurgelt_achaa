import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  GeoPoint, limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export async function createOrder(data) {
  return addDoc(collection(db, 'orders'), { ...data, status: 'pending', createdAt: serverTimestamp() });
}

export async function updateOrderStatus(orderId, status, extra = {}) {
  return updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp(), ...extra });
}

export function listenOrder(orderId, cb) {
  return onSnapshot(doc(db, 'orders', orderId), snap => { if (snap.exists()) cb({ id: snap.id, ...snap.data() }); });
}

export function listenAvailableOrders(vehicleType, cb) {
  const q = query(collection(db, 'orders'), where('status', '==', 'pending'), where('vehicleType', '==', vehicleType), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function listenCustomerOrders(customerId, cb) {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function listenDriverOrders(driverId, cb) {
  const q = query(collection(db, 'orders'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function listenAllOrders(cb) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ─── DRIVER LOCATION ─────────────────────────────────────────────────────────

export async function updateDriverLocation(driverId, lat, lng) {
  return updateDoc(doc(db, 'drivers', driverId), { location: new GeoPoint(lat, lng), locationUpdatedAt: serverTimestamp() });
}

export function listenDriverLocation(driverId, cb) {
  return onSnapshot(doc(db, 'drivers', driverId), snap => { if (snap.exists()) cb(snap.data()); });
}

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

export async function createDriverProfile(uid, data) {
  const ref2 = doc(db, 'drivers', uid);
  const snap = await getDoc(ref2);
  const payload = { ...data, userId: uid, status: 'pending', createdAt: serverTimestamp(), rating: 0, totalDeliveries: 0, onTimePercent: 0 };
  if (snap.exists()) return updateDoc(ref2, payload);
  return setDoc(ref2, payload);
}

export async function getDriverProfile(uid) {
  const snap = await getDoc(doc(db, 'drivers', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenAllDrivers(cb) {
  return onSnapshot(collection(db, 'drivers'), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
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
  await addDoc(collection(db, 'ratings'), { orderId, raterId, targetId, targetType, ...data, createdAt: serverTimestamp() });
  if (targetType === 'driver') {
    const q = query(collection(db, 'ratings'), where('targetId', '==', targetId));
    const snap = await getDocs(q);
    const ratings = snap.docs.map(d => d.data().stars);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, 'drivers', targetId), { rating: Math.round(avg * 10) / 10, totalRatings: ratings.length });
  }
}

export function listenRatings(targetId, cb) {
  const q = query(collection(db, 'ratings'), where('targetId', '==', targetId), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ─── AGREEMENTS ──────────────────────────────────────────────────────────────

export async function saveAgreement(userId, role, deviceInfo) {
  return addDoc(collection(db, 'agreements'), { userId, role, agreedAt: serverTimestamp(), deviceInfo });
}

// ─── PRICING CONFIG ──────────────────────────────────────────────────────────

export async function getPricingConfig() {
  const snap = await getDoc(doc(db, 'config', 'pricing'));
  return snap.exists() ? snap.data() : null;
}

export async function savePricingConfig(data) {
  return setDoc(doc(db, 'config', 'pricing'), { ...data, updatedAt: serverTimestamp() });
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function listenAllUsers(cb) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ─── SHOP ────────────────────────────────────────────────────────────────────

export async function createShopOrder(data) {
  return addDoc(collection(db, 'shopOrders'), { ...data, status: 'pending', createdAt: serverTimestamp() });
}

export function listenDriverShopOrders(driverId, cb) {
  const q = query(collection(db, 'shopOrders'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function updateShopOrderStatus(orderId, status) {
  return updateDoc(doc(db, 'shopOrders', orderId), { status, updatedAt: serverTimestamp() });
}

// ─── HELP REQUESTS ───────────────────────────────────────────────────────────

export async function createHelpRequest(data) {
  return addDoc(collection(db, 'helpRequests'), { ...data, status: 'open', createdAt: serverTimestamp() });
}

export function listenDriverHelpRequests(driverId, cb) {
  const q = query(collection(db, 'helpRequests'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function hasAgreed(userId) {
  const q = query(collection(db, 'agreements'), where('userId', '==', userId), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}
