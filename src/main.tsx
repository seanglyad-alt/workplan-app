import { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0b] text-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-[#111116] border border-red-500/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-white font-display">ប្រព័ន្ធជួបប្រទះបញ្ហាបច្ចេកទេស (Runtime Warning)</h2>
            <p className="text-xs text-slate-400 font-mono bg-[#16161a] p-3 rounded-xl border border-white/[0.06] text-left break-all max-h-40 overflow-y-auto">
              {this.state.error?.message || "Unknown error occurred"}
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer font-sans"
            >
              🔄 ផ្ទុកប្រព័ន្ធឡើងវិញ (Reset & Reload)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
