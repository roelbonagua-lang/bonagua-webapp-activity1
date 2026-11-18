import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred in WelHoop.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('WelHoop ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E7E5E4] rounded-2xl shadow-lg p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#B91C1C]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold text-[#1C1917]">
                Something went wrong
              </h1>
              <p className="text-sm text-[#57534E] leading-relaxed">{this.state.message}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload WelHoop
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
