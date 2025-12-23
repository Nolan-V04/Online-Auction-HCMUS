import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for now; can be sent to a monitoring service
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <strong className="text-red-700">Menu failed to load.</strong>
          <div className="text-sm text-gray-600">You can continue using the site — the menu will be retried on reload.</div>
        </div>
      );
    }

    return this.props.children;
  }
}