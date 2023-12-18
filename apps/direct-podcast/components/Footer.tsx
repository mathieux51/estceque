import React from 'react'
import styled from 'styled-components'
import CommonCreative from './CommonCreative'
import Help from './Help'
import Mail from './Mail'
import Tooltip from './Tooltip'
import useClickOutside from '../hooks/useClickOutside'
import packageJSON from '../package.json'

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

type Props = {
  className?: string
}

const Footer: React.FC<Props> = ({ className }) => {
  const buttonRef = React.createRef<HTMLButtonElement>()
  const [isVisible, setIsVisible] = React.useState(false)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isVisible && buttonRef.current) {
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
          <Button onClick={handleClick} ref={buttonRef} aria-label='Aide'>
            <StyledHelp />
          </Button>
        </Tooltip>
        <CommonCreative />
        <a
          href={`mailto:estceque.asso@gmail.com?Subject=directpodcast.fr v${packageJSON.version}`}
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
