import React from 'react';
import '../styles/theme.css';

// Catches render-time errors anywhere below it and shows a friendly card
// instead of a blank white screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="memory-page memory-page--center">
          <div className="memory-card">
            <h1 className="memory-title">Something went wrong</h1>
            <p className="memory-empty" style={{ marginBottom: 20 }}>
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button className="memory-button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
