# USTP CDO Campus Navigator

Expo Router starter for a Google Maps-inspired campus navigation app.

## Create / run
1. Install Node.js LTS.
2. Extract this project folder.
3. Open a terminal inside `ustp-campus-navigator`.
4. Run:

```bash
npm install
npx expo install react-native-maps expo-location
npx expo start
```

Scan the QR code with Expo Go. For Android, `react-native-maps` is supported in Expo Go. For store builds, configure your Google Maps API key and rebuild the native app.

## Notes
- This is a UI and navigation starter, not a production authentication backend.
- Sign-in/sign-up currently validates fields locally for demonstration. Connect Firebase or another backend before real use.
- Coordinates in `data/campusLocations.ts` are initial approximate/example pins. Verify every building location on-site or against an authoritative campus map before publishing.
- `provider={PROVIDER_GOOGLE}` requests Google Maps. API key setup is typically needed for standalone/development builds, not for the Expo Go preview.

## Add your Google Maps API key for native builds
See the Expo `react-native-maps` guide: https://docs.expo.dev/versions/latest/sdk/map-view/
