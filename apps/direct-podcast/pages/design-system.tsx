import React from 'react'
import styled from 'styled-components'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Mic from '../components/Mic'
import MicOff from '../components/MicOff'
import Help from '../components/Help'
import Mail from '../components/Mail'
import Timer from '../components/Timer'
import Mp3Toggle from '../components/Mp3Toggle'
import CommonCreative from '../components/CommonCreative'
import theme from '../styles/theme'

const Container = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.blue};
  display: flex;
  flex-direction: column;
`

const Main = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`

const Title = styled.h1`
  color: ${(props) => props.theme.grey};
  font-family: 'Antipasto', sans-serif;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
`

const Section = styled.section`
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.grey};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.grey};
  font-family: 'Antipasto', sans-serif;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${(props) => props.theme.grey};
`

const SubSection = styled.div`
  margin-bottom: 2rem;
`

const SubTitle = styled.h3`
  color: ${(props) => props.theme.grey};
  font-family: 'Antipasto', sans-serif;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: bold;
`

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`

const ColorSwatch = styled.div<{ $bgColor: string; $isLight?: boolean }>`
  padding: 1rem;
  border-radius: 4px;
  background: ${(props) => props.$bgColor};
  color: ${(props) => (props.$isLight ? '#005064' : '#ffffff')};
  border: 1px solid ${(props) => props.theme.grey};
  text-align: center;

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  code {
    font-size: 0.875rem;
    font-family: monospace;
  }
`

const TypographyExample = styled.div<{
  $fontSize?: string
  $fontFamily?: string
  $fontWeight?: string
}>`
  color: ${(props) => props.theme.grey};
  font-size: ${(props) => props.$fontSize || '1rem'};
  font-family: ${(props) => props.$fontFamily || "'Roboto', sans-serif"};
  font-weight: ${(props) => props.$fontWeight || 'normal'};
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-left: 3px solid ${(props) => props.theme.grey};
  padding-left: 1rem;

  span {
    display: block;
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 0.25rem;
    font-family: 'Roboto', sans-serif;
    font-weight: normal;
  }
`

const SpacingGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
`

const SpacingBox = styled.div<{ $size: string; $pixels: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;

  div {
    width: ${(props) => props.$size};
    height: ${(props) => props.$size};
    background: ${(props) => props.theme.grey};
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  span {
    color: ${(props) => props.theme.grey};
    font-size: 0.875rem;
    font-family: 'Antipasto', sans-serif;
  }
`

const ButtonGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`

const StyledButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: ${(props) => props.theme.grey};
  border: 2px solid ${(props) => props.theme.grey};
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 16px 32px;
    font-size: 18px;
  }

  &:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: ${(props) => props.theme.white};
  }

  &:active {
    transform: scale(0.98);
  }
`

const SecondaryButton = styled.button`
  background: ${(props) => props.theme.white};
  color: ${(props) => props.theme.blue};
  border: 1px solid ${(props) => props.theme.grey};
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 16px 32px;
    font-size: 18px;
  }

  &:hover {
    transform: scale(1.05);
    background: ${(props) => props.theme.grey};
    color: ${(props) => props.theme.white};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
`

const DangerButton = styled.button`
  background: ${(props) => props.theme.red};
  color: ${(props) => props.theme.white};
  border: 2px solid ${(props) => props.theme.red};
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 16px 32px;
    font-size: 18px;
  }

  &:hover {
    transform: scale(1.05);
    background: #a54550;
    border-color: #a54550;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
`

const IconGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
`

const IconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 70px;

  span {
    color: ${(props) => props.theme.grey};
    font-size: 0.875rem;
    font-family: 'Antipasto', sans-serif;
  }

  svg {
    width: 70px;
    height: 70px;
  }

  svg path {
    fill: ${(props) => props.theme.grey};
  }
`

const ComponentExample = styled.div`
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-bottom: 1rem;
`

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  color: ${(props) => props.theme.grey};
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  margin-top: 1rem;
`

const DesignSystemPage = () => {
  const [demoRecording, setDemoRecording] = React.useState(false)

  return (
    <Container>
      <Header showMp3Toggle={false} />
      <Main>
        <Title>Design System</Title>

        <Section>
          <SectionTitle>Colors</SectionTitle>

          <SubSection>
            <SubTitle>Primary Colors</SubTitle>
            <ColorGrid>
              <ColorSwatch $bgColor={theme.blue}>
                <strong>Blue</strong>
                <code>{theme.blue}</code>
              </ColorSwatch>
              <ColorSwatch $bgColor={theme.red}>
                <strong>Red</strong>
                <code>{theme.red}</code>
              </ColorSwatch>
            </ColorGrid>
          </SubSection>

          <SubSection>
            <SubTitle>Neutral Colors</SubTitle>
            <ColorGrid>
              <ColorSwatch $bgColor={theme.white} $isLight>
                <strong>White</strong>
                <code>{theme.white}</code>
              </ColorSwatch>
              <ColorSwatch $bgColor={theme.grey}>
                <strong>Grey</strong>
                <code>{theme.grey}</code>
              </ColorSwatch>
              <ColorSwatch $bgColor='#000000'>
                <strong>Black</strong>
                <code>#000000</code>
              </ColorSwatch>
            </ColorGrid>
          </SubSection>

          <SubSection>
            <SubTitle>Semantic Colors</SubTitle>
            <ColorGrid>
              <ColorSwatch $bgColor={theme.green}>
                <strong>Success (Green)</strong>
                <code>{theme.green}</code>
              </ColorSwatch>
              <ColorSwatch $bgColor={theme.red}>
                <strong>Error</strong>
                <code>{theme.red}</code>
              </ColorSwatch>
              <ColorSwatch $bgColor={theme.yellow}>
                <strong>Warning (Yellow)</strong>
                <code>{theme.yellow}</code>
              </ColorSwatch>
            </ColorGrid>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Typography</SectionTitle>

          <SubSection>
            <SubTitle>Font Families</SubTitle>
            <TypographyExample $fontFamily="'Roboto', sans-serif">
              Roboto - Primary font for body text
              <span>font-family: &apos;Roboto&apos;, sans-serif</span>
            </TypographyExample>
            <TypographyExample $fontFamily="'Antipasto', sans-serif">
              Antipasto - Display font for headings and timer
              <span>font-family: &apos;Antipasto&apos;, sans-serif</span>
            </TypographyExample>
          </SubSection>

          <SubSection>
            <SubTitle>Font Sizes</SubTitle>
            <TypographyExample $fontSize='0.75rem'>
              Extra Small (0.75rem / 12px)
              <span>font-size: 0.75rem</span>
            </TypographyExample>
            <TypographyExample $fontSize='0.875rem'>
              Small (0.875rem / 14px)
              <span>font-size: 0.875rem</span>
            </TypographyExample>
            <TypographyExample $fontSize='1rem'>
              Base (1rem / 16px)
              <span>font-size: 1rem</span>
            </TypographyExample>
            <TypographyExample $fontSize='1.5rem'>
              Large (1.5rem / 24px)
              <span>font-size: 1.5rem</span>
            </TypographyExample>
            <TypographyExample $fontSize='2rem'>
              Extra Large (2rem / 32px)
              <span>font-size: 2rem</span>
            </TypographyExample>
          </SubSection>

          <SubSection>
            <SubTitle>Font Weights</SubTitle>
            <TypographyExample $fontWeight='lighter'>
              Lighter
              <span>font-weight: lighter</span>
            </TypographyExample>
            <TypographyExample $fontWeight='normal'>
              Normal
              <span>font-weight: normal</span>
            </TypographyExample>
            <TypographyExample $fontWeight='bold'>
              Bold
              <span>font-weight: bold</span>
            </TypographyExample>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Spacing (8px Grid System)</SectionTitle>
          <SpacingGrid>
            <SpacingBox $size='8px' $pixels={8}>
              <div />
              <span>8px (base)</span>
            </SpacingBox>
            <SpacingBox $size='16px' $pixels={16}>
              <div />
              <span>16px (2x)</span>
            </SpacingBox>
            <SpacingBox $size='24px' $pixels={24}>
              <div />
              <span>24px (3x)</span>
            </SpacingBox>
            <SpacingBox $size='32px' $pixels={32}>
              <div />
              <span>32px (4x)</span>
            </SpacingBox>
            <SpacingBox $size='40px' $pixels={40}>
              <div />
              <span>40px (5x)</span>
            </SpacingBox>
            <SpacingBox $size='48px' $pixels={48}>
              <div />
              <span>48px (6x)</span>
            </SpacingBox>
            <SpacingBox $size='64px' $pixels={64}>
              <div />
              <span>64px (8x)</span>
            </SpacingBox>
          </SpacingGrid>
        </Section>

        <Section>
          <SectionTitle>Buttons</SectionTitle>

          <SubSection>
            <SubTitle>Button Variants</SubTitle>
            <ButtonGrid>
              <StyledButton>Primary Button</StyledButton>
              <SecondaryButton>Secondary Button</SecondaryButton>
              <DangerButton>Danger Button</DangerButton>
              <StyledButton
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Disabled Button
              </StyledButton>
            </ButtonGrid>
          </SubSection>

          <SubSection>
            <SubTitle>Toggle Components</SubTitle>
            <ComponentExample>
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div>
                  <Mp3Toggle defaultChecked={false} onChange={() => {}} />
                  <p
                    style={{
                      color: theme.grey,
                      fontSize: '14px',
                      marginTop: '8px',
                    }}
                  >
                    Off State
                  </p>
                </div>
                <div>
                  <Mp3Toggle defaultChecked={true} onChange={() => {}} />
                  <p
                    style={{
                      color: theme.grey,
                      fontSize: '14px',
                      marginTop: '8px',
                    }}
                  >
                    On State
                  </p>
                </div>
              </div>
            </ComponentExample>
            <CodeBlock>{`<Mp3Toggle defaultChecked={false} onChange={handleChange} />

// Specs:
// Button: 64px × 36px
// Circle: 28px × 28px
// Circle position: -1px (off) to calc(100% - 26px) (on)
// Glass morphism effect with backdrop blur`}</CodeBlock>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Icons</SectionTitle>
          <IconGrid>
            <IconWrapper>
              <Mic volumeLevel={0.5} />
              <span>Mic (Recording)</span>
            </IconWrapper>
            <IconWrapper>
              <MicOff />
              <span>Mic Off</span>
            </IconWrapper>
            <IconWrapper>
              <Help />
              <span>Help</span>
            </IconWrapper>
            <IconWrapper>
              <Mail />
              <span>Mail</span>
            </IconWrapper>
            <IconWrapper>
              <CommonCreative />
              <span>Creative Commons</span>
            </IconWrapper>
          </IconGrid>
        </Section>

        <Section>
          <SectionTitle>Components</SectionTitle>

          <SubSection>
            <SubTitle>Timer Component</SubTitle>
            <ComponentExample style={{ textAlign: 'center' }}>
              <Timer isRecording={demoRecording} />
              <div style={{ marginTop: '1rem' }}>
                <SecondaryButton
                  onClick={() => setDemoRecording(!demoRecording)}
                >
                  {demoRecording ? 'Stop Timer' : 'Start Timer'}
                </SecondaryButton>
              </div>
            </ComponentExample>
            <CodeBlock>{`<Timer isRecording={isRecording} />`}</CodeBlock>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Layout</SectionTitle>

          <SubSection>
            <SubTitle>Container Widths</SubTitle>
            <TypographyExample>
              <strong>Max Container:</strong> 960px
              <span>Used for main header/footer containers</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Main Content:</strong> 800px
              <span>Used for main content areas</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Tooltip:</strong> 500px
              <span>Maximum width for tooltip content</span>
            </TypographyExample>
          </SubSection>

          <SubSection>
            <SubTitle>Heights</SubTitle>
            <TypographyExample>
              <strong>Header:</strong> 70px
              <span>Fixed header height</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Footer:</strong> 92px
              <span>Fixed footer height</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Full Screen:</strong> 100vh
              <span>Main container height</span>
            </TypographyExample>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Breakpoints</SectionTitle>
          <TypographyExample>
            <strong>Mobile:</strong> 640px
            <span>Small screens and mobile devices</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Tablet:</strong> 768px
            <span>Tablets and small laptops</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Desktop:</strong> 1024px
            <span>Desktop screens</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Wide:</strong> 1280px
            <span>Large desktop screens</span>
          </TypographyExample>
        </Section>

        <Section>
          <SectionTitle>Transitions & Animations</SectionTitle>
          <TypographyExample>
            <strong>Fast:</strong> 0.2s ease
            <span>Quick interactions like hover states</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Normal:</strong> 0.3s ease
            <span>Standard transitions</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Slow:</strong> 0.8s ease
            <span>Slow fades and reveals</span>
          </TypographyExample>
          <TypographyExample>
            <strong>Pulse Animation:</strong> 2s cubic-bezier(0.4, 0, 0.6, 1)
            infinite
            <span>Used for recording button breathing effect</span>
          </TypographyExample>
        </Section>

        <Section>
          <SectionTitle>New Design Features</SectionTitle>

          <SubSection>
            <SubTitle>Visual Effects</SubTitle>
            <TypographyExample>
              <strong>Backdrop Blur:</strong> blur(10px)
              <span>Creates glass morphism effect on cards and buttons</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Box Shadows:</strong> Multiple levels
              <span>Small: 0 2px 8px rgba(0,0,0,0.1)</span>
              <span>Medium: 0 4px 12px rgba(0,0,0,0.15)</span>
              <span>Large: 0 6px 20px rgba(0,0,0,0.25)</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Scale Transform:</strong> scale(1.05) on hover
              <span>Provides tactile feedback for interactive elements</span>
            </TypographyExample>
          </SubSection>

          <SubSection>
            <SubTitle>Responsive Design</SubTitle>
            <TypographyExample>
              <strong>Font Scaling:</strong> Base 16px
              <span>Mobile (≤768px): 14px base</span>
              <span>Desktop (≥1440px): 18px base</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Touch Targets:</strong> Minimum 44x44px on mobile
              <span>Buttons increase to 16px padding on mobile</span>
              <span>Recording button: 14rem on mobile (vs 12rem desktop)</span>
            </TypographyExample>
          </SubSection>

          <SubSection>
            <SubTitle>Keyboard Interaction</SubTitle>
            <TypographyExample>
              <strong>Spacebar:</strong> Start/Stop recording
              <span>Works globally when no input is focused</span>
            </TypographyExample>
            <TypographyExample>
              <strong>Focus States:</strong> 2px outline with 2px offset
              <span>Visible focus indicators for all interactive elements</span>
            </TypographyExample>
          </SubSection>
        </Section>
      </Main>
      <Footer />
    </Container>
  )
}

export default DesignSystemPage
