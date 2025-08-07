import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  gap: 8px;
`

const Label = styled.span`
  color: ${(props) => props.theme.grey};
  font-size: 1rem;
  font-family: 'Antipasto', sans-serif;
`

const ToggleButton = styled.button<{ $isChecked: boolean }>`
  width: 64px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid ${(props) => props.theme.grey};
  border-radius: 18px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 72px;
    height: 40px;
    border-radius: 20px;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: ${(props) =>
      props.$isChecked ? props.theme.green : props.theme.white};
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.grey};
    outline-offset: 2px;
  }
`

const ToggleCircle = styled.div<{ $isChecked: boolean }>`
  width: 28px;
  height: 28px;
  background-color: ${(props) =>
    props.$isChecked ? props.theme.green : props.theme.grey};
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: ${(props) => (props.$isChecked ? 'calc(100% - 26px)' : '-1px')};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    left: ${(props) => (props.$isChecked ? 'calc(100% - 30px)' : '-1px')};
  }
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
