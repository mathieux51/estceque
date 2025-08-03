import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;
`

const Label = styled.span`
  color: ${(props) => props.theme.grey};
  margin-bottom: 0.5rem;
  font-size: 15px;
`

const ToggleButton = styled.button<{ $isChecked: boolean }>`
  width: 70px;
  height: 40px;
  background: transparent;
  border: 2px solid ${(props) => props.theme.grey};
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    border-color: ${(props) =>
      props.$isChecked ? '#19AB27' : props.theme.white};
  }

  &:focus {
    outline: 2px solid ${(props) => props.theme.grey};
    outline-offset: 2px;
  }
`

const ToggleCircle = styled.div<{ $isChecked: boolean }>`
  width: 30px;
  height: 30px;
  background-color: ${(props) =>
    props.$isChecked ? '#19AB27' : props.theme.grey};
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: ${(props) => (props.$isChecked ? '35px' : '3px')};
  transition: all 0.3s ease;
`

type Props = {
  defaultChecked?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const Mp3Toggle: React.FC<Props> = ({ defaultChecked = false, onChange }) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked)

  const handleClick = () => {
    const newChecked = !isChecked
    setIsChecked(newChecked)

    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        checked: newChecked,
        type: 'checkbox',
        value: newChecked ? 'on' : 'off',
      },
    } as React.ChangeEvent<HTMLInputElement>

    onChange(syntheticEvent)
  }

  return (
    <Container>
      <Label>MP3</Label>
      <ToggleButton
        type='button'
        $isChecked={isChecked}
        onClick={handleClick}
        aria-label={`MP3 format ${isChecked ? 'enabled' : 'disabled'}`}
        aria-pressed={isChecked}
      >
        <ToggleCircle $isChecked={isChecked} />
      </ToggleButton>
    </Container>
  )
}

export default Mp3Toggle
