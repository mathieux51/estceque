import React from "react"
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: #ffb732;
  height: 100vh;
  width: 100vw;
`

const Details = styled.details`
  cursor: pointer;
  width: 80vw;
  max-width: 960px;
`

const Pre = styled.pre`
  white-space: pre-wrap;
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <Container>
          <h2>
            <span role="img" aria-label="robot">
              🤖
            </span>{" "}
            Quelque chose a mal tourné.
          </h2>
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
