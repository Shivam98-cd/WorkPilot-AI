import React from 'react';

const UIUpdateAgent = ({ setUiState, getUiState, refs }) => {
  const updateTheme = (theme) => {
    setUiState(prev => ({ ...prev, theme }));
    // Apply theme to document root
    const root = document.documentElement;
    const themeColors = {
      blue: { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.35)' },
      purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.35)' },
      green: { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.35)' },
    };
    const colors = themeColors[theme] || themeColors.blue;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  const updateLayout = (layout) => {
    setUiState(prev => ({ ...prev, layout }));
  };

  const updateSidebarState = (isOpen) => {
    setUiState(prev => ({ ...prev, sidebarOpen: isOpen }));
  };

  const init = () => {
    // Initialize default UI state
    setUiState({
      theme: 'blue',
      layout: 'default',
      sidebarOpen: true,
      notifications: [],
    });
    // Apply default theme
    updateTheme('blue');
  };

  return {
    updateTheme,
    updateLayout,
    updateSidebarState,
    init,
  };
};

export default UIUpdateAgent;