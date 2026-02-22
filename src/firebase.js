import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCN7B9NYVDUvxqWiVhDE68lcrfsbOGHTRA",
  authDomain: "nanoprofiles-b92d6.firebaseapp.com",
  projectId: "nanoprofiles-b92d6",
  storageBucket: "nanoprofiles-b92d6.firebasestorage.app",
  messagingSenderId: "722906539476",
  appId: "1:722906539476:web:a7d83d7c9241dbcd9d6241",
  measurementId: "G-32Q63VGL9T"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google Popup", error);
    if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
      return auth.signInWithRedirect(googleProvider);
    }
    throw error;
  }
};

export const googleRedirectLogin = () => auth.signInWithRedirect(googleProvider);
export const getGoogleRedirectResult = () => auth.getRedirectResult();
export const logout = () => auth.signOut();
export const onAuthStateChanged = (_auth, callback) => auth.onAuthStateChanged(callback);
/** Returns current user's Firebase ID token for backend API (artist owner routes). */
export const getIdToken = () => auth.currentUser?.getIdToken?.() ?? null;
export default firebase;
