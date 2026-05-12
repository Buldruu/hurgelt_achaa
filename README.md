# 🚛 АчааЗам — Монгол Ачаа Хүргэлтийн Платформ

React 18 + Firebase Firestore + OpenStreetMap дээр бүтээсэн бүрэн том тээврийн зуучлагч апп.

## Технологи
- **React 18 + Vite** — Frontend
- **Zustand** — State management
- **Firebase Firestore** — Realtime database
- **Firebase Auth** — OTP phone login
- **Firebase Storage** — Зураг хадгалах
- **Firebase Hosting** — Хостинг
- **Leaflet + OpenStreetMap** — Газрын зураг (map)
- **GitHub Actions** — Auto deploy

## Хурдан эхлүүлэх

```bash
# 1. Dependencies суулгах
npm install

# 2. .env файл үүсгэх
cp .env.example .env
# .env дотор Firebase config-ийн утгуудаа оруулна уу

# 3. Локал ажиллуулах
npm run dev

# 4. Build
npm run build
```

## Firebase тохиргоо
1. [Firebase Console](https://console.firebase.google.com) → Add project
2. Authentication → Phone sign-in идэвхжүүлэх
3. Firestore Database үүсгэх
4. Storage идэвхжүүлэх
5. Hosting идэвхжүүлэх
6. `.env.example` файлыг `.env` болгож config утгуудаа оруулах
7. `firestore.rules` файлыг Firebase-д байршуулах:
   ```bash
   firebase deploy --only firestore:rules
   ```

## GitHub Auto Deploy
GitHub → Settings → Secrets-т Firebase config утгуудаа нэмэх.
`main` branch руу push хийхэд автоматаар Firebase Hosting-д deploy болно.

## Дэлгэрэнгүй README.md-ыг эх кодоос харна уу.
