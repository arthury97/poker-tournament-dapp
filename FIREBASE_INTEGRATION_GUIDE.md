# 🔥 Firebase Auth Integration Guide

## ✅ Integration Complete!

Firebase Authentication has been successfully integrated into the React app. The app now uses Firebase Auth instead of localStorage for secure, production-ready authentication.

---

## 📋 What Was Changed

### 1. **Installed Firebase SDK**
- Added `firebase` package to `package.json`

### 2. **Created Firebase Configuration**
- **File:** `frontend/src/config/firebase.js`
- Initializes Firebase app, auth, and Firestore
- Uses environment variables for configuration

### 3. **Replaced AuthContext**
- **File:** `frontend/src/context/AuthContext.js`
- Now uses Firebase Auth instead of localStorage
- Features:
  - Real user authentication with Firebase
  - Automatic session management
  - User data stored in Firestore
  - Secure password handling (Firebase handles hashing)
  - Email verification support

### 4. **Created Environment Variables Template**
- **File:** `frontend/.env.example`
- Template for Firebase configuration

---

## 🚀 Setup Instructions

### Step 1: Create Firebase Project (if not done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or select existing project
3. Follow the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. **Enable** the first option (Email/Password)
6. Click **"Save"**

### Step 3: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location
5. Click **"Done"**

### Step 4: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) → **Project settings**
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → **Web app icon** (`</>`)
4. Register your app (nickname: `staked-web`)
5. Copy the `firebaseConfig` object

### Step 5: Configure Environment Variables

1. **Create `.env` file** in `frontend/` directory:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Firebase config:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSyC...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef...
   ```

3. **Restart the development server** after creating `.env`:
   ```bash
   npm start
   ```

---

## 🔒 Security Rules for Firestore

Update your Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for tournament data (optional)
    match /tournaments/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**To update rules:**
1. Go to Firebase Console → Firestore Database → Rules
2. Paste the rules above
3. Click **"Publish"**

---

## ✅ Features

### What You Get:

- ✅ **Secure Authentication** - Firebase handles password hashing
- ✅ **Session Management** - Automatic session persistence
- ✅ **User Data Storage** - Stored in Firestore
- ✅ **Email Verification** - Can be enabled in Firebase Console
- ✅ **Password Reset** - Can be added easily
- ✅ **Production Ready** - Google infrastructure, 99.95% uptime

### User Data Structure in Firestore:

```
users/
  {userId}/
    name: "John Doe"
    email: "john@example.com"
    createdAt: "2025-01-27T..."
    emailVerified: false
```

---

## 🧪 Testing

### Test Sign Up:
1. Open the app
2. Click "Connect Wallet" (if not authenticated)
3. Click "Create Account"
4. Fill in name, email, password
5. Submit
6. Check Firebase Console → Authentication → Users (should see new user)

### Test Sign In:
1. Sign out
2. Click "Sign In"
3. Enter email and password
4. Submit
5. Should be authenticated

### Test Session Persistence:
1. Sign in
2. Refresh the page
3. Should remain signed in (Firebase handles this automatically)

---

## 🐛 Troubleshooting

### Error: "Firebase is not ready yet"
- **Solution:** Check that `.env` file exists and has correct values
- **Solution:** Restart the development server after creating `.env`

### Error: "Permission denied"
- **Solution:** Check Firestore security rules
- **Solution:** Ensure Authentication is enabled in Firebase Console

### Error: "Invalid API key"
- **Solution:** Double-check your Firebase config in `.env`
- **Solution:** Ensure you copied the web app config (not iOS/Android)

### Users not appearing in Firestore
- **Solution:** Check Firestore security rules allow writes
- **Solution:** Check browser console for errors

---

## 📝 Migration Notes

### What Changed:
- ❌ **Removed:** localStorage-based authentication
- ✅ **Added:** Firebase Auth integration
- ✅ **Added:** Firestore for user data storage

### Backward Compatibility:
- **Old localStorage users:** Will need to create new accounts (this is expected for production)
- **No data migration needed:** This is a fresh start with secure authentication

---

## 🚀 Next Steps

1. ✅ **Set up Firebase project** (if not done)
2. ✅ **Configure `.env` file** with your Firebase config
3. ✅ **Test authentication flow**
4. ⚠️ **Update Firestore security rules** (for production)
5. ⚠️ **Enable email verification** (optional, in Firebase Console)
6. ⚠️ **Add password reset functionality** (optional, can be added later)

---

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

---

**Status:** ✅ Integration Complete  
**Last Updated:** 2025-01-27

