// src/firebase/auth.js
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Send OTP
export async function sendOTP(phoneNumber) {
  // phoneNumber: "+97699110000" format
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    window.recaptchaVerifier
  );
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}

// Verify OTP
export async function verifyOTP(code) {
  const result = await window.confirmationResult.confirm(code);
  return result.user;
}

// Create/update user profile in Firestore
export async function upsertUserProfile(uid, data) {
  const ref = doc(db, 'users', uid);
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

// Auth state observer
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function logout() {
  return signOut(auth);
}
