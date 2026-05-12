import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ─── PHONE AUTH ───────────────────────────────────────────────────────────────

export async function sendOTP(phoneNumber) {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
  window.confirmationResult = result;
  return result;
}

export async function verifyOTP(code) {
  const result = await window.confirmationResult.confirm(code);
  return result.user;
}

// ─── EMAIL AUTH ───────────────────────────────────────────────────────────────

export async function registerWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function upsertUserProfile(uid, data) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      role: data.role || 'customer',
    });
  }
  return (await getDoc(ref)).data();
}

// ─── COMMON ───────────────────────────────────────────────────────────────────

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function logout() {
  return signOut(auth);
}