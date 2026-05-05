# Crypto Pulse - Trading App

A modern cryptocurrency trading application with real-time market data and cross-device admin control.

## Features

- 📊 Real-time cryptocurrency prices from CoinGecko API
- 🕯️ Professional candlestick charts with technical analysis
- 💰 Binary options trading with configurable timeframes
- 👥 User account management with email/password authentication
- 🔧 Admin panel for managing user balances across devices
- ☁️ Firebase Firestore for cloud data synchronization
- 📱 Responsive design for mobile and desktop

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" for development
4. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click "Add app" and select Web (</>) icon
   - Copy the config values

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm start
```

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all the `REACT_APP_*` variables from your `.env` file
4. Deploy!

## Admin Panel Access

- Click the PRIMEBLOCK logo 5 times quickly to access admin panel
- Default admin credentials: `admin@cp88.com` / `123`
- Admin can manage user balances from any device

## Firebase Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Technologies Used

- React 19
- Firebase Firestore
- CoinGecko API
- Lightweight Charts (for candlestick rendering)
- CSS3 with modern responsive design

## License

MIT License

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
