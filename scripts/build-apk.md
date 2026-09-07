# Gerar APK - OficIA HENIZA

## Pre-requisitos
- Node 20+
- Android Studio + SDK
- Java 17

## Passos

```bash
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

No Android Studio: Build -> Generate Signed Bundle / APK -> APK.

Debug:
```bash
cd android && ./gradlew assembleDebug
```
