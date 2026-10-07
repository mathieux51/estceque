'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className='min-h-screen py-8'>
          <div className='max-w-4xl mx-auto px-4'>
            <div className='bg-white/5 rounded-lg shadow-lg p-8'>
              <div className='flex items-center mb-6'>
                <svg
                  className='w-12 h-12 text-danger mr-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <h1 className='text-2xl font-bold text-grey'>
                  Oups ! Quelque chose s&apos;est mal passé
                </h1>
              </div>

              <div className='mb-6'>
                <p className='text-grey mb-4'>
                  Nous avons rencontré une erreur inattendue lors du traitement
                  de votre demande. Ne vous inquiétez pas, vos fichiers audio
                  sont en sécurité.
                </p>

                <div className='bg-danger/30 border border-danger rounded-lg p-4 mb-4'>
                  <h2 className='text-sm font-semibold text-danger mb-2'>
                    Détails de l&apos;erreur :
                  </h2>
                  <p className='text-sm text-grey font-mono'>
                    {this.state.error.message}
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' &&
                  this.state.errorInfo && (
                    <details className='bg-deep border border-grey/40 rounded-lg p-4'>
                      <summary className='cursor-pointer text-sm font-semibold text-grey mb-2'>
                        Trace de la pile (développement uniquement)
                      </summary>
                      <pre className='text-xs text-grey/70 overflow-auto'>
                        {this.state.error.stack}
                        {'\n\nComponent Stack:\n'}
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
              </div>

              <div className='flex space-x-4'>
                <button
                  onClick={this.resetError}
                  className='px-4 py-2 bg-white text-brand font-medium rounded-lg hover:bg-grey hover:text-white transition-colors'
                >
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-white/10 text-grey rounded-lg hover:bg-white/20 transition-colors'
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
