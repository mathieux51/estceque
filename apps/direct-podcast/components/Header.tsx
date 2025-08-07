import React from 'react'
import styled from 'styled-components'
import Mp3Toggle from './Mp3Toggle'

const Container = styled.div`
  max-width: 960px;
  display: flex;
  justify-content: end;
  width: 100%;
  margin: 0 auto;
`

type Props = {
  className?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  showMp3Toggle?: boolean
}

const Header: React.FC<Props> = ({
  className,
  onChange,
  showMp3Toggle = true,
}) => {
  return (
    <Container className={className}>
      {showMp3Toggle && onChange && (
        <Mp3Toggle defaultChecked={false} onChange={onChange} />
      )}
    </Container>
  )
}

export default Header
