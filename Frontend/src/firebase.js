import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

/**
 * Fully resets local auth state, dispatches immediate UI logout event,
 * and signs out of Firebase Auth with a safety timeout.
 */
export async function signOutUser() {
  // 1. Immediately clean up local session tokens and conversation state
  try {
    localStorage.removeItem('wp_tokens');
    localStorage.removeItem('wp_active_conversation');
    localStorage.removeItem('wp_cockpit_history');
    localStorage.removeItem('wp_cockpit_pins');
  } catch (e) {
    console.warn('Storage cleanup error:', e);
  }

  // 2. Dispatch custom event so listeners (API cache, React UI) update immediately without circular imports
  window.dispatchEvent(new CustomEvent('wp-user-signed-out'));

  // 3. Sign out from Firebase Auth with timeout safeguard
  try {
    await Promise.race([
      signOut(auth),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase signOut timeout')), 2500))
    ]);
  } catch (err) {
    console.warn('Firebase signOut finished with note:', err?.message || err);
  }
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
};
export default app;

