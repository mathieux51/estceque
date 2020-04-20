import React from "react"
import styled from "styled-components"
import CommonCreative from "./CommonCreative"
import Help from "./Help"
import Mail from "./Mail"
import Tooltip from "./Tooltip"
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

const BottomNote = styled.span`
  width: 100%;
  color: ${(props) => props.theme.grey};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
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

  useClickOutside(buttonRef, () => setIsVisible(false))

  return (
    <Container className={className}>
      <SubContainer>
        <Tooltip isVisible={isVisible}>
          <Button onClick={handleClick} ref={buttonRef}>
            <StyledHelp />
          </Button>
        </Tooltip>
        <CommonCreative />
        <a href="mailto:contact@directpodcast.fr?Subject=directpodcast.fr">
          <StyledMail />
        </a>
      </SubContainer>
      <BottomNote>D’après une idée originale de Blandine Schmidt</BottomNote>
    </Container>
  )
}

export default Footer
