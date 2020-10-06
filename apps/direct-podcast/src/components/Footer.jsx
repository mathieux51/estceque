import React from 'react'
import styled from 'styled-components'
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'
import CommonCreative from './CommonCreative'
import Help from './Help'
import Mail from './Mail'
import Tooltip from './Tooltip'
import useClickOutside from '../hooks/useClickOutside'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const SubContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  max-width: 960px;
  align-items: center;
  margin: 0 auto;
`

const Button = styled.button`
  margin-left: 1rem;
`

const StyledHelp = styled(Help)`
  width: 70px;
  & path {
    fill: ${(props) => props.theme.grey};
  }
`

const StyledMail = styled(Mail)`
  margin-right: 1rem;
  width: 70px;
  & path {
    fill: ${(props) => props.theme.grey};
  }
`

const BottomNote = styled.h1`
  width: 100%;
  color: ${(props) => props.theme.grey};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  font-weight: normal;
  margin: 0;
`

const Footer = ({ className }) => {
  const buttonRef = React.createRef()
  const [isVisible, setIsVisible] = React.useState(false)
  const handleClick = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    if (!isVisible) {
      buttonRef.current.focus()
      setIsVisible(true)
      return
    }
    setIsVisible(false)
  }

  // useClickOutside(buttonRef, () => setIsVisible(false))
  const [email, setEmail] = React.useState('')
  const handleOnVerify = (token) => {
    if (token) {
      setEmail('contact@directpodcast.fr')
    }
  }

  return (
    <Container className={className}>
      <SubContainer>
        <Tooltip isVisible={isVisible}>
          <Button onClick={handleClick} ref={buttonRef} aria-label='Aide'>
            <StyledHelp />
          </Button>
        </Tooltip>
        <CommonCreative />
        <GoogleReCaptcha onVerify={handleOnVerify} />
        <a
          href={`mailto:${email}?Subject=directpodcast.fr`}
          aria-label='courriel'
        >
          <StyledMail />
        </a>
      </SubContainer>
      <BottomNote>D’après une idée originale de Blandine Schmidt</BottomNote>
    </Container>
  )
}

export default Footer
