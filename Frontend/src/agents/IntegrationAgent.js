import { auth, signOut } from '../firebase';
import { backendLogout } from '../api';

const IntegrationAgent = ({ setState, getState }) => {
  const initializeFirebaseAuth = async () => {
    try {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setState(prev => ({
            ...prev,
            user: {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              uid: user.uid,
            },
            isAuthenticated: true,
          }));
        } else {
          setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Failed to initialize Firebase auth:', error);
    }
  };

  const backendLoginWithFirebase = async (idToken) => {
    const { backendFirebaseAuth } = await import('../api');
    return backendFirebaseAuth(idToken);
  };

  const fetchDashboardData = async () => {
    const { getDashboardSummary } = await import('../api');
    try {
      setState(prev => ({
        ...prev,
        loading: { ...(prev.loading || {}), dashboard: true },
      }));
      const res = await getDashboardSummary();
      setState(prev => ({
        ...prev,
        ...res.data,
        loading: { ...(prev.loading || {}), dashboard: false },
      }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: { ...(prev.loading || {}), dashboard: false },
        error: { ...(prev.error || {}), dashboard: error.message },
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await backendLogout();
      await signOut();
      setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
    } catch (error) {
      console.error('Logout error:', error);
      // Still attempt to sign out from Firebase
      try {
        await signOut();
      } catch (firebaseError) {
        console.error('Firebase logout error:', firebaseError);
      }
      setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
    }
  };

  const init = async () => {
    const unsubscribe = await initializeFirebaseAuth();
    return unsubscribe;
  };

  return {
    initializeFirebaseAuth,
    backendLoginWithFirebase,
    fetchDashboardData,
    handleLogout,
    init,
  };
};

export default IntegrationAgent;