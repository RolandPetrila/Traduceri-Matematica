"use client";

import React from "react";
import { logError } from "@/lib/monitoring";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logError(error.message, {
      stack: error.stack,
      source: "react-error-boundary",
      context: { componentStack: info.componentStack || undefined },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen chalkboard-bg flex items-center justify-center p-8">
          <div className="chalk-card max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-chalk-yellow mb-4">
              A aparut o eroare
            </h2>
            <p className="text-chalk-white mb-2">
              {this.state.error?.message || "Eroare necunoscuta"}
            </p>
            <p className="text-chalk-white/60 text-sm mb-6">
              Eroarea a fost inregistrata automat in loguri.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="chalk-btn"
            >
              Reincarca pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
