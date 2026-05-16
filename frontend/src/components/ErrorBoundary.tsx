import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled error:', error, info.componentStack);
  }

  handleReload = () => window.location.reload();
  handleHome = () => { this.setState({ hasError: false, error: null }); window.location.href = '/'; };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-gray-950 animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={44} className="text-red-400 dark:text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Something went wrong</h1>
          <p className="text-slate-500 dark:text-gray-400 max-w-sm mb-4 leading-relaxed">
            An unexpected error occurred. This has been logged and we'll look into it.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-6 max-w-lg w-full text-left">
              <summary className="text-xs font-semibold text-slate-400 dark:text-gray-600 cursor-pointer hover:text-slate-600 dark:hover:text-gray-400 mb-2">
                Error details (dev only)
              </summary>
              <pre className="bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-4 text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                {this.state.error.message}{'\n\n'}{this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all text-sm">
              <RefreshCw size={16} /> Reload Page
            </button>
            <button onClick={this.handleHome}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-sky-500/30">
              <Home size={16} /> Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
