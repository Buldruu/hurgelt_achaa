// src/store/useStore.js
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  user: null,          // Firebase Auth user
  userProfile: null,   // Firestore user doc
  driverProfile: null, // Firestore driver doc
  role: null,          // 'customer' | 'driver' | 'admin'

  setUser: (user) => set({ user }),
  setUserProfile: (p) => set({ userProfile: p, role: p?.role || null }),
  setDriverProfile: (p) => set({ driverProfile: p }),
  setRole: (role) => set({ role }),

  // ── Active order (customer tracking) ─────────────────────
  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),

  // ── Driver: available orders nearby ──────────────────────
  availableOrders: [],
  setAvailableOrders: (orders) => set({ availableOrders: orders }),

  // ── Driver: current active delivery ──────────────────────
  driverActiveOrder: null,
  setDriverActiveOrder: (order) => set({ driverActiveOrder: order }),

  // ── Order history ─────────────────────────────────────────
  orderHistory: [],
  setOrderHistory: (orders) => set({ orderHistory: orders }),

  // ── Admin ─────────────────────────────────────────────────
  allOrders: [],
  allDrivers: [],
  setAllOrders: (orders) => set({ allOrders: orders }),
  setAllDrivers: (drivers) => set({ allDrivers: drivers }),

  // ── UI ────────────────────────────────────────────────────
  loading: false,
  setLoading: (v) => set({ loading: v }),
}));

export default useStore;
