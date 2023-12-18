import { css } from 'styled-components'
import sizes from './sizes'

export const media = (Object.keys(sizes) as (keyof typeof sizes)[]).reduce(
  (acc, label) => {
    acc[label] = (literals: TemplateStringsArray, ...placeholders: any[]) => // eslint-disable-line
      css`
        @media (min-width: ${sizes[label] / 20}em) {
          ${css(literals, ...placeholders)};
        }
      `.join('')
    return acc
  },
  {} as Record<
    keyof typeof sizes | string,
    (l: TemplateStringsArray, ...p: any[]) => string // eslint-disable-line
  >,
)

export default media
