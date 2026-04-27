import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './components/ui/button';
import { logger } from '@/core/utils/logger';

/**
 * ErrorBoundary - 全局错误边界组件
 * 用于捕获 React 组件树中的错误，防止整个应用崩溃
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
          <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">应用出现错误</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || '抱歉，应用程序遇到了一个意外错误。'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;