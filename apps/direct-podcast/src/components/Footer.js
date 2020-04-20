import React from "react"
import styled from "styled-components"
import CommonCreative from "./CommonCreative"
import Help from "./Help"
import Mail from "./Mail"
import Tooltip from "./Tooltip"

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 960px;
  align-items: center;
  margin: 0 auto;
`

const StyledHelp = styled(Help)`
  margin-left: 1rem;
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

const Footer = ({ className }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const handleClick = () => setIsVisible(!isVisible)
  return (
    <Container className={className}>
      <Tooltip isVisible={isVisible}>
        <button onClick={handleClick}>
          <StyledHelp />
        </button>
      </Tooltip>
      <CommonCreative />
      <a href="mailto:contact@directpodcast.fr?Subject=directpodcast.fr">
        <StyledMail />
      </a>
    </Container>
  )
}

export default Footer
