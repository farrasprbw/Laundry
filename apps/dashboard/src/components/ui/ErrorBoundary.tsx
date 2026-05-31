import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@nextui-org/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-danger/10 flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-danger text-[48px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              error
            </span>
          </div>
          <h2 className="text-headline-md font-headline-md text-on-background mb-2">
            Oops, terjadi kesalahan
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-md mb-1">
            Aplikasi mengalami error yang tidak terduga. Silakan coba muat ulang
            halaman.
          </p>
          <p className="text-body-sm font-body-sm text-on-surface-variant/60 max-w-md mb-6 font-mono">
            {this.state.error?.message}
          </p>
          <div className="flex gap-3">
            <Button
              color="primary"
              onPress={this.handleRetry}
              startContent={
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
              }
            >
              Coba Lagi
            </Button>
            <Button
              variant="flat"
              onPress={() => window.location.reload()}
              startContent={
                <span className="material-symbols-outlined text-[18px]">
                  restart_alt
                </span>
              }
            >
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
