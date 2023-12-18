import React from 'react'
import styled from 'styled-components'
import Toggle from 'react-toggle'

const Container = styled.div`
  max-width: 960px;
  display: flex;
  justify-content: end;
  width: 100%;
  margin: 0 auto;
`

const SubContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;
`

const StyledText = styled.span`
  color: ${(props) => props.theme.grey};
  margin-bottom: 0.5rem;
`

type Props = {
  className?: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const Header: React.FC<Props> = ({ className, onChange }) => {
  return (
    <Container className={className}>
      <SubContainer>
        <StyledText>mp3</StyledText>
        <Toggle defaultChecked={false} icons={false} onChange={onChange} />
      </SubContainer>
    </Container>
  )
}

export default Header
