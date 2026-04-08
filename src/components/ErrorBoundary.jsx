import { Component } from 'react';
import { logError } from '../lib/errorLogger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const userId = this.props.userId || null;
    const page = window.location.pathname;
    logError(userId, page, error.message, errorInfo?.componentStack || error.stack || '');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
          <div className="text-center max-w-sm fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01" stroke="var(--status-overdue)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="10" stroke="var(--status-overdue)" strokeWidth="1.5"/>
              </svg>
            </div>
            <h1 className="text-[18px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h1>
            <p className="text-[13px] mb-4" style={{ color: 'var(--text-hint)' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
