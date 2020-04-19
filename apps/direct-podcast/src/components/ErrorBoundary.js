import React from "react"
import styled from "styled-components"
import * as Sentry from "@sentry/browser"

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: #ffb732;
  height: 100vh;
  width: 100vw;
`

const TextContainer = styled.div`
  width: 60vw;
  max-width: 960px;
`

const Details = styled.details`
  margin-top: 1rem;
  cursor: pointer;
  width: 60vw;
  max-width: 960px;
  min-height: 200px;
`

const Pre = styled.pre`
  white-space: pre-wrap;
`

const EventID = styled.pre`
  display: inline;
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null, eventID: "" }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo)
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
        <Container>
          <TextContainer>
            <h2>
              <span role="img" aria-label="robot">
                🤖
              </span>{" "}
              Quelque chose a mal tourné.
            </h2>
            <span>
              Numéro de l'incident :{" "}
              <button onClick={this.handleClick}>
                <EventID>{this.state.eventID}</EventID>
              </button>
            </span>
          </TextContainer>
          <Details>
            <Pre>{this.state.error && this.state.error.toString()}</Pre>
          </Details>
        </Container>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
