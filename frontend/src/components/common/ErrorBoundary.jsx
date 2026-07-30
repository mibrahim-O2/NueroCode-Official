import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Logged so the exact stack trace is available in DevTools console
    // even though the UI below shows only a short message.
    console.error('NeuroCode caught a render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-obsidian px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-status-error" />
          <h1 className="font-heading font-semibold text-lg text-text-primary">Something went wrong</h1>
          <p className="max-w-md font-mono text-xs text-text-muted">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-button bg-emerald px-4 py-2 text-sm text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover"
          >
            <RotateCcw className="h-4 w-4" /> Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}