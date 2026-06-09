"use client"
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] p-6">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-2">
              Something went wrong
            </h2>
            <p className="text-[#65676b] dark:text-[#b0b3b8] mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
