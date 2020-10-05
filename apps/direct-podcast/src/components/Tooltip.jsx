import React from "react"
import styled from "styled-components"
import elementInvisible from "../style/elementInvisible"

const Right = styled.span`
  width: 70vw;
  max-width: 500px;
  top: 100%;
  left: 100%;
  margin-left: 3px;
  transform: translate(0, -100%);
  padding: 10px 20px;
  color: ${(props) => props.theme.white};
  background: ${(props) => props.theme.blue};
  border-radius: 4px;
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
  border: 1px solid ${(props) => props.theme.white};
  transition: opacity 0.8s;
`

const Container = styled.div`
  display: inline-block;
  position: relative;
  text-align: left;
  & ${Right} {
    ${(props) => (props.isVisible ? "" : elementInvisible)};
  }
`

const I = styled.i`
  position: absolute;
  bottom: 29px;
  right: 100%;
  margin-top: -12px;
  width: 12px;
  height: 24px;
  overflow: hidden;

  &::after {
    content:'';
    position: absolute;
    width: 12px;
    height: 12px;
    left: 0;
    top: 50%;
    transform: translate(50%,-50%) rotate(-45deg);
    background: ${(props) => props.theme.white};
    box-shadow: 0 1px 8px rgba(0,0,0,0.5);
  `

const Tooltip = ({ className, children, isVisible }) => (
  <Container isVisible={isVisible} className={className}>
    {children}
    <Right>
      <p>
        Je clique --> J'autorise l'accès à mon micro --> Je parle --> Lorsque
        j’ai terminé, je clique une seconde fois pour arrêter mon enregistrement
        --> Le fichier sonore se télécharge automatiquement sur mon appareil.
      </p>
      <I />
    </Right>
  </Container>
)

export default Tooltip
