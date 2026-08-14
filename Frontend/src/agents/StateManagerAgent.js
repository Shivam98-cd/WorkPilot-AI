import React from 'react';

const StateManagerAgent = ({ setState, getState }) => {
  const setUser = (user) => {
    setState(prev => ({ ...prev, user }));
  };

  const setAuthStatus = (isAuthenticated) => {
    setState(prev => ({ ...prev, isAuthenticated }));
  };

  const setLoading = (key, value) => {
    setState(prev => ({
      ...prev,
      loading: { ...(prev.loading || {}), [key]: value }
    }));
  };

  const setError = (key, message) => {
    setState(prev => ({
      ...prev,
      error: { ...(prev.error || {}), [key]: message }
    }));
  };

  const init = () => {
    // Initialize default state
    setState({
      user: null,
      isAuthenticated: false,
      loading: {},
      error: {},
      dailyBrief: '',
    });
  };

  return {
    setUser,
    setAuthStatus,
    setLoading,
    setError,
    init,
  };
};

export default StateManagerAgent;