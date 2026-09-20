import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WorkPilot ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#08080b',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            We encountered an unexpected interface issue. You can reload the workspace safely.
          </p>
          {this.state.error && (
            <details style={{ maxWidth: '640px', width: '90%', marginBottom: '1.5rem', textAlign: 'left', cursor: 'pointer' }}>
              <summary style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', outline: 'none', marginBottom: '0.4rem' }}>View Technical Details</summary>
              <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', margin: '0.5rem 0' }}>
                {this.state.error?.toString()}
              </div>
              {this.state.error?.stack && (
                <pre style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.7)',
                  overflowX: 'auto',
                  maxHeight: '160px'
                }}>
                  {this.state.error.stack}
                </pre>
              )}
            </details>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d2ff, #8b5cf6)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Reload Workspace
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
