# Arshad Shamsi AI (Android-ready project)

React + Vite + Capacitor Android project adapted from the supplied dashboard source.

## Run locally
1. Install Node.js 20+ and Android Studio with Android SDK.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add a Gemini API key if you want AI generation enabled.
4. Run `npm run build`.
5. Run `npx cap add android` (first time), then `npx cap sync android`.
6. Open `android/` in Android Studio or run `cd android && ./gradlew assembleDebug`.

## GitHub APK build
Upload this folder to a GitHub repository. The included workflow builds a debug APK on push to `main` or via Actions > Build Android APK > Run workflow. Download it from the workflow run's Artifacts.

## Important data note
Without a configured Gemini API key, AI research buttons return no generated data. Product lists are not fabricated and must not be presented as verified sales. Saved products are stored locally on the device. Live eBay competition requires a separately configured eBay Developer API integration; this starter does not claim sold-volume access.
