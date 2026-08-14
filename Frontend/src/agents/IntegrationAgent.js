import { auth, signOut } from '../firebase';
import { backendLogout, getProfile, backendFirebaseAuth, getEmails, getCalendarEvents, getTeamMembers, getDeployments, getDocuments, getAnalytics, getIntegrations } from '../api';

const IntegrationAgent = ({ setState, getState }) => {
  const initializeFirebaseAuth = async () => {
    try {
      // Firebase auth state listener
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const idToken = await user.getIdToken();
          // Sync with backend
          try {
            await backendLoginWithFirebase(idToken); // Assuming we have a helper
            const profile = await getProfile();
            setState(prev => ({ ...prev, user: profile, isAuthenticated: true }));
          } catch (error) {
            console.error('Firebase backend sync failed:', error);
            // Fallback to Firebase user data
            setState(prev => ({ 
              ...prev, 
              user: { 
                email: user.email, 
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid 
              }, 
              isAuthenticated: true 
            }));
          }
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
    return await backendFirebaseAuth(idToken);
  };

  const fetchDashboardData = async () => {
    try {
      // Set loading states
      setState(prev => ({ 
        ...prev, 
        loading: { 
          ...(prev.loading || {}), 
          emails: true, 
          calendar: true, 
          team: true, 
          deployments: true, 
          documents: true, 
          analytics: true, 
          integrations: true 
        } 
      }));
      
      // Fetch all data in parallel
      const [
        emails,
        calendarEvents,
        teamMembers,
        deployments,
        documents,
        analytics,
        integrations
      ] = await Promise.all([
        getEmails(),
        getCalendarEvents(),
        getTeamMembers(),
        getDeployments(),
        getDocuments(),
        getAnalytics(),
        getIntegrations()
      ]);
      
      // Update state with fetched data
      setState(prev => ({
        ...prev,
        emails,
        calendarEvents,
        teamMembers,
        deployments,
        documents,
        analytics,
        integrations,
        loading: {
          ...(prev.loading || {}),
          emails: false,
          calendar: false,
          team: false,
          deployments: false,
          documents: false,
          analytics: false,
          integrations: false
        }
      }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setState(prev => ({
        ...prev,
        error: {
          ...(prev.error || {}),
          dashboard: error.message
        },
        loading: {
          ...(prev.loading || {}),
          emails: false,
          calendar: false,
          team: false,
          deployments: false,
          documents: false,
          analytics: false,
          integrations: false
        }
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
    // Initialize Firebase auth listener
    const unsubscribe = await initializeFirebaseAuth();
    // Initial data fetch
    await fetchDashboardData();
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