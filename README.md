# 🚛 АчааЗам — Монгол Ачаа Хүргэлтийн Платформ

React 19 + Firebase + OpenStreetMap дээр бүтээсэн бүрэн том тээврийн зуучлагч апп.

## Технологи

- **React 19 + Vite 8** — Frontend framework
- **Zustand** — State management
- **Firebase Auth** — Имэйл + OTP утасны нэвтрэлт
- **Firebase Firestore** — Realtime database
- **Firebase Storage** — Зураг хадгалах
- **Leaflet / OpenStreetMap** — Газрын зураг
- **GitHub Actions + GitHub Pages** — Автомат deploy

---

## 🚀 Анхны тохиргоо (Нэг удаа хийнэ)

### 1. Firebase Project үүсгэх

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. **Authentication** → Sign-in method → **Email/Password** болон **Phone** идэвхжүүлэх
3. **Firestore Database** → Create database → Production mode
4. **Storage** → Get started
5. **Project Settings** → Your apps → **Add app (Web)** → Config утгуудыг хуулж авах

### 2. Firestore Rules тохируулах

Firebase Console → **Firestore Database** → **Rules** tab → доорх кодыг хуулж **Publish** дарна:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isDriver() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == driverId || isAdmin());
    }
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        isAdmin() ||
        resource.data.customerId == request.auth.uid ||
        resource.data.driverId == request.auth.uid ||
        (isDriver() && resource.data.status == 'pending')
      );
      allow delete: if isAdmin();
    }
    match /ratings/{ratingId} {
      allow read, create: if request.auth != null;
    }
    match /agreements/{agreementId} {
      allow read, create: if request.auth != null;
    }
    match /config/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /shopOrders/{orderId} {
      allow read: if request.auth != null && (resource.data.driverId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update: if request.auth != null && (resource.data.driverId == request.auth.uid || isAdmin());
    }
    match /helpRequests/{reqId} {
      allow read: if request.auth != null && (resource.data.driverId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update: if isAdmin();
    }
  }
}
```

### 3. GitHub Repository тохируулах

#### 3а. Repository үүсгэх

```bash
# GitHub дээр шинэ repo үүсгэсний дараа:
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/ТАНЫ_USERNAME/REPO_НЭР.git
git push -u origin main
```

#### 3б. vite.config.js-д repo нэрээ тохируулах

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/REPO_НЭР/',   // ← өөрийн GitHub repo нэртэй таарах ёстой
})
```

#### 3в. GitHub Secrets нэмэх

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Дараах 6 secret нэмнэ үү:

| Secret нэр | Утга |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123` |

#### 3г. GitHub Pages идэвхжүүлэх

GitHub repo → **Settings** → **Pages** → Source: **GitHub Actions**

---

## 💻 Локал хөгжүүлэлт

```bash
# 1. Хуулж авах
git clone https://github.com/ТАНЫ_USERNAME/REPO_НЭР.git
cd REPO_НЭР

# 2. Dependencies суулгах
npm install

# 3. .env файл үүсгэх
cp .env.example .env
# .env файлд Firebase config утгуудаа оруулна уу

# 4. Ажиллуулах
npm run dev

# 5. Build шалгах
npm run build
```

---

## 📁 Төслийн бүтэц

```
src/
├── firebase/
│   ├── config.js      — Firebase холболт
│   ├── auth.js        — Нэвтрэлт (email, OTP)
│   └── db.js          — Firestore functions
├── pages/
│   ├── LoginPage.jsx      — Нэвтрэх / Бүртгүүлэх
│   ├── AgreementPage.jsx  — Гэрээ зөвшөөрөх
│   ├── customer/
│   │   └── CustomerApp.jsx  — Захиалагчийн апп
│   ├── driver/
│   │   └── DriverApp.jsx    — Жолоочийн апп
│   └── admin/
│       └── AdminPanel.jsx   — Админы самбар
├── components/
│   ├── common/UI.jsx      — Нийтлэг UI компонентууд
│   └── map/DeliveryMap.jsx — Газрын зураг
├── store/useStore.js   — Zustand state
└── utils/pricing.js    — Үнийн тооцоолол
```

---

## 👥 Хэрэглэгчийн эрхүүд

| Эрх | Тайлбар |
|---|---|
| `customer` | Захиалга үүсгэх, хянах, үнэлэх |
| `driver` | Захиалга авах, хүргэх, дэлгүүр, тусламж |
| `admin` | Бүх захиалга, жолооч баталгаажуулах, үнэ тохируулах |

Admin эрх олгохын тулд Firebase Console → Firestore → `users` collection → тухайн хэрэглэгчийн doc → `role` талбарыг `"admin"` болгоно.

---

## 🔄 Deploy процесс

`main` branch руу push хийх бүрт автоматаар:
1. GitHub Actions ажиллана
2. `npm ci` → `npm run build`
3. `dist/` хавтсыг GitHub Pages руу байршуулна

**Live URL:** `https://ТАНЫ_USERNAME.github.io/REPO_НЭР/`
