import React from "react"
import styled from "styled-components"
import Footer from "./Footer"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.blue};
`

const SubContainer = styled.div`
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
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

const Emo = styled.span`
  font-size: 48px;
`

const StyledFooter = styled(Footer)`
  height: 20%;
`

const ErrorComponent = ({ className, text, eventID, error, onClick }) => (
  <Container className={className}>
    <SubContainer>
      <TextContainer>
        <h2>
          <Emo role="img" aria-label="robot">
            🤖
          </Emo>{" "}
          <Text>{text}</Text>
        </h2>
        {eventID && (
          <span>
            <Text>Numéro de l'incident : </Text>
            <Button onClick={onClick}>
              <EventID>{eventID}</EventID>
            </Button>
          </span>
        )}
      </TextContainer>
      {error && (
        <Details>
          <Pre>{error.toString()}</Pre>{" "}
        </Details>
      )}
    </SubContainer>
    <StyledFooter />
  </Container>
)

export default ErrorComponent
