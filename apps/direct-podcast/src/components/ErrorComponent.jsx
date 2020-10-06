import React from 'react'
import styled from 'styled-components'
import Footer from './Footer'
import media from '../media'

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
  ${media.down('md')} {
    width: 90vw;
  }
  max-width: 960px;
  position: relative;
`

const Text = styled.span`
  color: ${(props) => props.theme.white};
  ${media.down('md')} {
    font-size: 20px;
  }
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

const StyledFooter = styled(Footer)`
  height: 20%;
`

const Bubble = styled(Text)`
  margin-bottom: 1rem;
  max-width: 500px;
  font-weight: normal;

  color: ${(props) => props.theme.white};
  background: ${(props) => props.theme.blue};
  border-radius: 1rem;
  z-index: 1;
  border: 1px solid ${(props) => props.theme.white};
  transition: opacity 0.8s;
  padding: 1rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    bottom: 0;
    left: 80px;
    border: 0.75rem solid transparent;
    border-top: none;
    transform: rotate(180deg) translate3d(0, -100%, 0);
    border-bottom-color: ${(props) => props.theme.white};
  }
`

const Title = styled.h2`
  margin: 0;
  display: flex;
  flex-direction: column;
`

const ErrorComponent = ({ className, text, eventID, error, onClick }) => {
  const emojiStyle = { fontSize: 80, paddingLeft: '3rem' }
  return (
    <Container className={className}>
      <SubContainer>
        <TextContainer>
          <Title>
            <Bubble>{text}</Bubble>
            <span role='img' aria-label='error' style={emojiStyle}>
              🤖
            </span>
          </Title>
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
            <Pre>{error.toString()}</Pre>
            {' '}
          </Details>
        )}
      </SubContainer>
      <StyledFooter />
    </Container>
  )
}

export default ErrorComponent
