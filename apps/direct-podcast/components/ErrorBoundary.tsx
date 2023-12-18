import React from 'react'
import * as Sentry from '@sentry/browser'
import UAParser from 'ua-parser-js'
import { GetUserMediaError } from '../helpers/errors'
import ErrorComponent from './ErrorComponent'

function inIframe() {
  try {
    return window.self !== window.top
  } catch (error) {
    return true
  }
}

function getUserMediaErrorText({
  name,
  version,
  os,
}: {
  name?: string
  version?: string
  os?: string
}) {
  if (os === 'iOS' && name !== 'Mobile Safari') {
    return `Désolé ! Le navigateur ${name} (v${version}) n'est pas supporté par directpodcast.fr. Sur iOS il est recommandé d'utiliser "Mobile Safari"`
  }
  if (name) {
    return `Désolé ! Le navigateur ${name} (v${version}) n'est pas supporté par directpodcast.fr.`
  }
  return "Désolé ! Ce navigateur n'est pas supporté par directpodcast.fr."
}

type Props = {
  children?: React.ReactNode
}

type State = {
  error: Error
  digest?: string | null
  componentStack?: string | null
  eventID: string
  component: React.ReactElement | null
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: new Error(),
    digest: null,
    componentStack: null,
    eventID: '',
    component: null,
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (inIframe()) {
      this.setState({
        component: (
          <ErrorComponent text="Pour utiliser directpodcast.fr, il faut l'ouvrir dans sa propre page." />
        ),
      })
      return
    }

    if (error instanceof GetUserMediaError) {
      const parser = new UAParser()
      const { name, version } = parser.getBrowser()
      const os = parser.getOS()
      const text = getUserMediaErrorText({ name, version, os: os.name })

      this.setState({
        component: <ErrorComponent text={text} />,
      })
      return
    }

    if (error.name && error.name.match('NotFoundError')) {
      this.setState({
        component: (
          <ErrorComponent text="directpodcast.fr n'a pas trouvé de microphone." />
        ),
      })
      return
    }

    if (
      (error.message && error.message.match('NotAllowedError')) ||
      (error.name && error.name.match('NotAllowedError'))
    ) {
      this.setState({
        component: (
          <ErrorComponent text="Pour utiliser directpodcast.fr, il faut autoriser l'activation du micro." />
        ),
      })
      return
    }
    Sentry.withScope((scope) => {
      scope.setExtra('error.message', error.message)
      scope.setExtra('error.name', error.name)
      scope.setExtra('digest', errorInfo.digest)
      scope.setExtra('componentStack', errorInfo.componentStack)

      const eventID = Sentry.captureException(error)
      this.setState({
        error,
        digest: errorInfo.digest,
        componentStack: errorInfo.componentStack,
        eventID,
      })
    })
  }

  handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const { eventID } = this.state
    await navigator.clipboard.writeText(eventID)
  }

  render() {
    const { digest, componentStack, eventID, error, component } = this.state
    const { children } = this.props
    if (digest || componentStack) {
      return (
        <ErrorComponent
          text='Quelque chose a mal tourné...'
          eventID={eventID}
          onClick={this.handleClick}
          error={error}
        />
      )
    }
    if (component) {
      return component
    }
    return children
  }
}

export default ErrorBoundary
