/** Structured data for search engines (schema.org). */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type='application/ld+json'
      // JSON.stringify output is safe here once "<" is escaped.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
