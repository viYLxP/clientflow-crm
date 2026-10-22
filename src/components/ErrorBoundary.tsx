import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useI18n } from '../i18n';

interface Props {
  children: ReactNode;
  title: string;
  body: string;
  reloadLabel: string;
}

class Boundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-panel" role="alert">
        <h1>{this.props.title}</h1>
        <p>{this.props.body}</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          {this.props.reloadLabel}
        </button>
      </div>
    );
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <Boundary title={t('error.boundary.title')} body={t('error.boundary.body')} reloadLabel={t('error.boundary.reload')}>
      {children}
    </Boundary>
  );
}
