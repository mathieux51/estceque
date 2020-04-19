import React from "react"
import styled from "styled-components"
import * as Sentry from "@sentry/browser"

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.blue};
`

const TextContainer = styled.div`
  width: 60vw;
  max-width: 960px;
`

const Text = styled.span`
  color: ${(props) => props.theme.white};
`
const Button = styled.button`
  color: ${(props) => props.theme.white};
`

const Details = styled.details`
  margin-top: 1rem;
  cursor: pointer;
  width: 60vw;
  max-width: 960px;
  min-height: 200px;
  color: ${(props) => props.theme.white};
`

const Pre = styled.pre`
  white-space: pre-wrap;
  color: ${(props) => props.theme.white};
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
              <Text>Quelque chose a mal tourné.</Text>
            </h2>
            <span>
              <Text>Numéro de l'incident : </Text>
              <Button onClick={this.handleClick}>
                <EventID>{this.state.eventID}</EventID>
              </Button>
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
