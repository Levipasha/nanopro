import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged 
} from "firebase/auth";
/**
 * Updated Firebase Configuration
 * Project: nanoprofiles-54c87
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** 
 * signInWithPopup works on any hosting provider (Vercel, Netlify, etc.).
 * signInWithRedirect requires Firebase Hosting's /__/firebase/init.json relay,
 * which does NOT exist on Vercel — causing 404 errors.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Keep for backward compatibility — now delegates to popup flow
export const googleRedirectLogin = () => signInWithGoogle();
// No-op: redirect result is no longer used, popup resolves synchronously
export const getGoogleRedirectResult = () => Promise.resolve(null);
export const logout = () => signOut(auth);

// Wrapper to match previous arg order/style if needed
export const onAuthStateChanged = (_auth, callback) => firebaseOnAuthStateChanged(auth, callback);

/** Returns current user's Firebase ID token for backend API verification. */
export const getIdToken = async () => {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (e) {
    return null;
  }
};

export default app;
