import React from "react"
import styled from "styled-components"

const Container = styled.div`
  color: ${(props) => props.theme.white};
`

const A = styled.a`
  color: ${(props) => props.theme.white};
`

const CommonCreative = ({ className }) => (
  <Container className={className}>
    <A rel="license" href="http://creativecommons.org/licenses/by-nc-nd/4.0/">
      <img
        alt="Licence Creative Commons"
        style={{ borderWidth: 0 }}
        src="https://i.creativecommons.org/l/by-nc-nd/4.0/80x15.png"
      />
    </A>
  </Container>
)

//   <br />
//          Ce(tte) ≈ìuvre est mise √† disposition selon les termes de la{" "}
//     <A rel="license" href="http://creativecommons.org/licenses/by-nc-nd/4.0/">
//            Licence Creative Commons Attribution - Pas d&#39;Utilisation Commerciale -
//         Pas de Modification 4.0 International
//     </A>

export default CommonCreative
