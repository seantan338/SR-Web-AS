import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',fontFamily:'sans-serif'}}>
          <h2>Something went wrong</h2>
          <p style={{color:'#666'}}>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} style={{marginTop:'1rem',padding:'0.5rem 1rem',background:'#FF6B35',color:'white',border:'none',borderRadius:'6px',cursor:'pointer'}}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
