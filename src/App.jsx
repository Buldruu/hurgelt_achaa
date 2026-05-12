// src/App.jsx
import { useEffect, useState } from 'react';
import { onAuth } from './firebase/auth';
import { getDriverProfile, hasAgreed } from './firebase/db';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import useStore from './store/useStore';
import LoginPage from './pages/LoginPage';
import AgreementPage from './pages/AgreementPage';
import CustomerApp from './pages/customer/CustomerApp';
import DriverApp from './pages/driver/DriverApp';
import AdminPanel from './pages/admin/AdminPanel';
import { Toaster } from 'react-hot-toast';
import { Spinner } from './components/common/UI';

export default function App() {
  const { user, setUser, setUserProfile, setDriverProfile, userProfile } = useStore();
  const [authLoading, setAuthLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const unsub = onAuth(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const profile = { ...snap.data(), uid: firebaseUser.uid };
          setUserProfile(profile);
          if (profile.role === 'driver') {
            const dp = await getDriverProfile(firebaseUser.uid);
            if (dp) setDriverProfile(dp);
          }
        }
        // Өмнө нь гэрээ зөвшөөрсөн эсэхийг шалгана — зөвшөөрсөн бол дахин харуулахгүй
        const alreadyAgreed = await hasAgreed(firebaseUser.uid);
        if (alreadyAgreed) setAgreed(true);
      } else {
        setUser(null);
        setUserProfile(null);
        setAgreed(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🚛</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>АчааЗам</div>
        <Spinner />
      </div>
    );
  }

  if (!user) return (
    <>
      <Toaster position="top-center" />
      <LoginPage />
    </>
  );

  if (!agreed) return (
    <>
      <Toaster position="top-center" />
      <div style={{ maxWidth: 430, margin: '0 auto', paddingTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>Гэрээ зөвшөөрөх</div>
        </div>
        <AgreementPage role={userProfile?.role || 'customer'} onAccepted={() => setAgreed(true)} />
      </div>
    </>
  );

  const role = userProfile?.role;
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: 14 } }} />
      {role === 'admin'  && <AdminPanel />}
      {role === 'driver' && <DriverApp />}
      {(!role || role === 'customer') && <CustomerApp />}
    </>
  );
}
