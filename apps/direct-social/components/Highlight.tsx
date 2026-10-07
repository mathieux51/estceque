// Highlight shows search snippets, where the API puts matches between ⟦ and ⟧.
export default function Highlight({ text }: { text: string }) {
  return (
    <>
      {text.split(/(⟦[^⟧]*⟧)/).map((part, i) =>
        part.startsWith('⟦') ? <mark key={i}>{part.slice(1, -1)}</mark> : <span key={i}>{part}</span>,
      )}
    </>
  )
}
