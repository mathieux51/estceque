import React from "react"
import * as Sentry from "@sentry/browser"
import { GetUserMediaError } from "../errors"
import ErrorComponent from "./ErrorComponent"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null, eventID: "", component: null }
  }

  componentDidCatch(error, errorInfo) {
    if (error instanceof GetUserMediaError) {
      this.setState({
        component: (
          <ErrorComponent text="Désolé ! Ce navigateur n'est pas supporté par directpodcast.fr" />
        ),
      })
      return
    }

    if (
      (error.message && error.message.match("NotAllowedError")) ||
      (error.name && error.name.match("NotAllowedError"))
    ) {
      this.setState({
        component: (
          <ErrorComponent text="Pour utiliser directpodcast.fr, il faut autoriser l'activation du micro." />
        ),
      })
      return
    }
    Sentry.withScope((scope) => {
      scope.setExtra("error.message", error.message)
      scope.setExtra("error.name", error.name)
      scope.setExtra("errorInfo", errorInfo)
      const eventID = Sentry.captureException(error)
      this.setState({
        error: error,
        errorInfo: errorInfo,
        eventID,
      })
    })
  }

  handleClick = async (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    await navigator.clipboard.writeText(this.state.eventID)
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <ErrorComponent
          text="Quelque chose a mal tourné..."
          eventID={this.state.eventID}
          onClick={this.handleClick}
          error={this.state.error}
        />
      )
    }
    if (this.state.component) {
      return this.state.component
    }
    return this.props.children
  }
}

export default ErrorBoundary
