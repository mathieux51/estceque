import React from 'react';
import styled from 'styled-components';
import CreativeCommonIcon from './CreativeCommonIcon';

const Container = styled.div`
  color: ${(props) => props.theme.white};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const A = styled.a`
  color: ${(props) => props.theme.white};
`;

const StyledCreativeCommonIcon = styled(CreativeCommonIcon)`
  width: 80px;
  height: 15px;
`;

const CommonCreative = ({ className }) => (
  <Container className={className}>
    <A
      rel="license"
      href="http://creativecommons.org/licenses/by-nc-nd/4.0/"
      target="_blank"
    >
      <StyledCreativeCommonIcon />
    </A>
  </Container>
);

//   <br />
//          Ce(tte) ≈ìuvre est mise √† disposition selon les termes de la{" "}
//     <A rel="license" href="http://creativecommons.org/licenses/by-nc-nd/4.0/">
//            Licence Creative Commons Attribution - Pas d&#39;Utilisation Commerciale -
//         Pas de Modification 4.0 International
//     </A>

export default CommonCreative;
