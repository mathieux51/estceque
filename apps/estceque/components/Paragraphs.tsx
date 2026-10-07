import { Fragment } from 'react'

const URL_PATTERN = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?»"'])/g

/** Plain text with its links made clickable (no HTML from the feed is injected). */
function Linked({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            className='link break-all'
            href={part}
            rel='nofollow noopener'
          >
            {part.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}

export default function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className='prose-text'>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.split('\n').map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              <Linked text={line} />
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  )
}
